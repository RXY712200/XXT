import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { page, clock, microtasks } from './support.js';
import { bootstrap } from '../src/runtime/browser.js';
import { defaults, validateSettings, sampleDelay, createPreferences, storageKey } from '../src/runtime/preferences.js';
import { createDiagnostics } from '../src/runtime/diagnostics.js';
import { createInventoryReader } from '../src/platform/inventory.js';
import { createCoordinator } from '../src/core/coordinator.js';
import { createNativeNavigation } from '../src/runtime/native-navigation.js';
import { createArtifact, verifyArtifact } from '../scripts/build-userscript.mjs';

function memory(initial = null) {
  let value = initial;
  return { getItem: () => value, setItem(key,text) { assert.equal(key,storageKey); value = text; } };
}
function product(kinds = ['video'], settings = {}, options = {}) {
  const f = page(kinds), time = clock(), storage = options.storage || memory();
  if (!options.storage) storage.setItem(storageKey,JSON.stringify({version:1,settings:{...defaults,delays:false,...settings},stopped:false,restUntil:0,count:0,seen:[]}));
  const controls = f.players.filter(Boolean).map(media => {
    const state = { paused: true, ended: false, currentTime: 0, calls: 0 };
    for (const key of ['paused','ended','currentTime']) Object.defineProperty(media,key,{get:()=>state[key]});
    Object.defineProperty(media,'readyState',{value:4});
    media.play = () => { state.calls++; state.paused = false; return Promise.resolve(); };
    media.pause = () => { state.paused = true; };
    return state;
  });
  options.prepare?.(f);
  const app = bootstrap(f.document,{clock:time,storage,ui:options.ui ?? false,random:()=>0});
  return { ...f,time,storage,controls,app,
    async tick(ms=0) { time.advance(ms); await microtasks(); },
    end(i=0) { controls[i].ended=true; f.players[i].dispatchEvent(new f.dom.window.Event('ended')); },
    close() { app.dispose(); f.dom.window.close(); } };
}

test('settings are versioned/validated; v0 migration and corrupt/failed storage fail closed', () => {
  assert.equal(validateSettings({}).minMs,5000); assert.equal(validateSettings({}).maxMs,12000);
  assert.throws(()=>validateSettings({minMs:12001,maxMs:12000})); assert.throws(()=>validateSettings({restEnabled:true}));
  const store=memory(JSON.stringify({version:0,settings:{video:false},stopped:true})), p=createPreferences(store);
  assert.equal(p.snapshot().settings.video,false); assert.equal(JSON.parse(store.getItem()).version,1);
  assert.equal(p.snapshot().stopped,true);
  const broken=createPreferences(memory('{broken')); assert.equal(broken.snapshot().stopped,true); assert.ok(broken.snapshot().error);
  const denied=createPreferences({getItem(){throw Error('denied');},setItem(){throw Error('denied');}});
  assert.equal(denied.snapshot().stopped,true); assert.throws(()=>denied.resume());
});

test('random bounds use integer milliseconds and independent draws; disabled delays consume no draw', () => {
  assert.equal(sampleDelay(defaults,()=>0),5000); assert.equal(sampleDelay(defaults,()=>0.999999999),12000);
  let i=0;const draws=[0.1,0.2,0.3];assert.deepEqual(draws.map(()=>sampleDelay(defaults,()=>draws[i++])),[5700,6400,7100]);
  assert.equal(sampleDelay({...defaults,delays:false},()=>{throw Error('unused');}),0);
});

test('bootstrap owns one runtime; Stop survives disposal/reload until explicit Resume', async () => {
  const f=product(); await f.tick(); assert.equal(f.controls[0].calls,1);
  assert.equal(bootstrap(f.document,{ui:false}),f.app); f.app.stop(); assert.equal(f.controls[0].paused,true);
  f.app.dispose(); const again=bootstrap(f.document,{clock:f.time,storage:f.storage,ui:false});
  await f.tick(1000); assert.equal(f.controls[0].calls,1); assert.ok(again.view().message.includes('停止'));
  again.resume(); await f.tick(); assert.equal(f.controls[0].calls,2); again.dispose(); f.dom.window.close();
});

test('current feature disable stops safely, while unrelated preference leaves healthy video playing', async () => {
  const f=product(); await f.tick(); f.app.update({audio:false}); assert.equal(f.controls[0].paused,false);
  f.app.update({video:false}); assert.equal(f.controls[0].paused,true); assert.equal(JSON.parse(f.storage.getItem()).stopped,true);
  await f.tick(1000); assert.equal(f.controls[0].calls,1); f.close();
});

test('persisted periodic rest counts unique supported local results, never credit, and Stop preserves its deadline', async () => {
  const time=clock(), store=memory(), p=createPreferences(store,time.now);
  p.update({restEnabled:true,restCount:1,restMs:1000}); assert.equal(p.record('stable-content','video'),true);
  assert.equal(p.record('stable-content','video'),false); assert.equal(p.record('live-session','live'),false);
  const deadline=p.snapshot().restUntil; p.stop(); assert.equal(createPreferences(store,time.now).snapshot().restUntil,deadline);
  const f=product(['video','video'],{restEnabled:true,restCount:1,restMs:1000}); await f.tick(); f.end(); await f.tick();
  assert.equal(f.app.view().platformConfirmed,false); assert.equal(f.controls[1].calls,0);
  await f.tick(500); assert.equal(f.controls[1].calls,0); f.app.stop(); await f.tick(1000);
  assert.equal(f.controls[1].calls,0); assert.ok(JSON.parse(f.storage.getItem()).restUntil>0); f.close();
  const g=product(['video','video'],{restEnabled:true,restCount:1,restMs:1000});await g.tick();g.end();await g.tick();await g.tick(1000);
  assert.equal(g.controls[1].calls,1);assert.equal(g.app.view().platformConfirmed,false);g.close();
});

test('one transition delay is drawn once and no missing platform credit can navigate', async () => {
  const f=product(['video','video'],{delays:true,minMs:5000,maxMs:5000}); await f.tick(); f.end(); await f.tick();
  assert.equal(f.app.view().delayed,true); await f.tick(4999); assert.equal(f.controls[1].calls,0);
  await f.tick(1); assert.equal(f.controls[1].calls,1); f.end(1); await f.tick(500);
  assert.equal(f.app.view().platformConfirmed,false); assert.equal(f.document.querySelector('.posCatalog_active').id,'unit-0-0'); f.close();
});

test('same-lesson DOM replacement pauses rather than replaying old local evidence', async () => {
  const f=product(); await f.tick(); f.owners[0].replaceWith(f.owners[0].cloneNode()); await f.tick(1000);
  // A verifiably same-lesson loading replacement now gets the authorized finite
  // wait, rather than immediate Stop. Missing content still never replays.
  assert.equal(f.controls[0].calls,1); assert.equal(JSON.parse(f.storage.getItem()).stopped,false);
  await f.tick(10000);assert.equal(f.controls[0].calls,1);assert.equal(JSON.parse(f.storage.getItem()).stopped,true);f.close();
});

test('native navigation renews a branded permit after long delay and requires actual target content change', async () => {
  const f=page(), time=clock(), reader=createInventoryReader(), c=createCoordinator({clock:time});f.markLesson();c.bind(reader.scan(f.document));
  const target=f.document.querySelector('#unit-0-1');let clicks=0;
  target.addEventListener('click',()=>{clicks++;f.document.querySelector('.posCatalog_active').classList.remove('posCatalog_active');target.classList.add('posCatalog_active');
    f.root.body.innerHTML='<iframe id="new-content" class="ans-attach-online ans-insertvideo-online"></iframe>';
    f.root.querySelector('iframe').contentDocument.body.innerHTML='<video id="video_html5_api" src="https://invalid.example/next"></video>';});
  const port=createNativeNavigation(f.document,reader,()=>c.snapshot().inventory);
  c.queueNavigation(c.navigationDecision('prior-credit').permit,port,{delay:6000,refresh:true});time.advance(6000);await microtasks();
  assert.equal(clicks,1);assert.equal(c.snapshot().diagnostic,'navigation-acknowledged');assert.equal(c.snapshot().inventory.lesson.id,'unit-0-1');
  c.destroy();f.dom.window.close();
});

test('forged renewable permit, stale target, and click without content acknowledgement never advance', async () => {
  for(const mode of ['forged','stale','no-ack']){
    const f=page(),time=clock(),reader=createInventoryReader(),c=createCoordinator({clock:time});f.markLesson();c.bind(reader.scan(f.document));let clicks=0;
    f.document.querySelector('#unit-0-1').addEventListener('click',()=>clicks++);
    const permit=c.navigationDecision('prior-credit').permit;
    c.queueNavigation(mode==='forged'?{...permit}:permit,createNativeNavigation(f.document,reader,()=>c.snapshot().inventory),{delay:10,refresh:true,acknowledgementMs:100});
    if(mode==='stale')f.document.querySelector('#unit-0-1').setAttribute('aria-disabled','true');
    time.advance(10);await microtasks();time.advance(100);await microtasks();
    assert.equal(clicks,mode==='no-ack'?1:0);assert.notEqual(c.snapshot().diagnostic,'navigation-acknowledged');
    c.destroy();f.dom.window.close();
  }
});

test('Chinese panel collapses, persists validated switches and clears sanitized diagnostics', async () => {
  const f=product([],{}, {ui:true});await f.tick();const root=f.document.querySelector('#xxt-control').shadowRoot;
  assert.equal(root.querySelector('details').open,false);root.querySelector('details').open=true;
  const input=root.querySelector('[data-setting="audio"]');input.checked=false;input.dispatchEvent(new f.dom.window.Event('change'));
  assert.equal(JSON.parse(f.storage.getItem()).settings.audio,false); assert.ok(root.textContent.includes('恢复默认'));
  const journal=createDiagnostics();for(let i=0;i<120;i++)journal.add('selection','RUNNING','video','secret-token');
  journal.add('https://private.example/?token=secret','student-123','private-course');
  const data=JSON.parse(journal.export());assert.equal(data.events.length,100);assert.ok(!journal.export().includes('secret'));
  journal.clear();assert.deepEqual(JSON.parse(journal.export()).events,[]);f.close();
});

test('generated artifact exactly matches modules/metadata and console/userscript share one stopped owner', () => {
  const code=createArtifact();assert.match(code,/==UserScript==/);assert.equal(verifyArtifact(),verifyArtifact(code));assert.equal(verifyArtifact(code).length,64);assert.throws(()=>verifyArtifact(code+'tampered'));
  const dom=new JSDOM('<!doctype html><body></body>',{url:'https://mooc1.chaoxing.com/mycourse/studentstudy?courseid=synthetic',runScripts:'outside-only'});
  dom.window.localStorage.setItem(storageKey,JSON.stringify({version:1,settings:defaults,stopped:true,restUntil:0,count:0,seen:[]}));
  dom.window.eval(code);const app=dom.window.XXT;dom.window.eval(code);assert.equal(dom.window.XXT,app);
  assert.equal(bootstrap(dom.window.document),app);assert.equal(dom.window.document.querySelectorAll('#xxt-control').length,1);
  app.dispose();dom.window.close();
});

test('initial delayed frame is bounded and storage write failure immediately stops managed playback', async () => {
  const f=product(['video'],{}, {prepare(p){p.document.querySelector('iframe[info="card"]').remove();}});
  await f.tick(1000);assert.equal(f.controls[0].calls,0);
  const frame=f.document.createElement('iframe');frame.setAttribute('info','card');f.document.body.append(frame);
  frame.contentDocument.body.innerHTML='<iframe id="late-owned" class="ans-attach-online ans-insertvideo-online"></iframe>';
  const doc=frame.contentDocument.querySelector('iframe').contentDocument, media=doc.createElement('video');let calls=0,paused=true;
  media.id='video_html5_api';media.src='https://invalid.example/late';Object.defineProperties(media,{readyState:{value:4},paused:{get:()=>paused}});
  media.play=()=>{calls++;paused=false;return Promise.resolve();};media.pause=()=>{paused=true;};doc.body.append(media);
  await f.tick(500);assert.equal(calls,1);f.close();
  const timed=product([],{},{});await timed.tick(10000);assert.equal(JSON.parse(timed.storage.getItem()).stopped,true);timed.close();
  const g=product();await g.tick();g.storage.setItem=()=>{throw Error('write denied');};
  assert.throws(()=>g.app.update({audio:false}));assert.equal(g.controls[0].paused,true);g.close();
});

test('manual catalog change waits for actual replacement content instead of restarting obsolete media', async () => {
  const f=product();await f.tick();f.document.querySelector('.posCatalog_active').classList.remove('posCatalog_active');f.document.querySelector('#unit-0-1').classList.add('posCatalog_active');
  await f.tick(500);assert.equal(f.controls[0].calls,1);assert.equal(f.controls[0].paused,true);
  f.root.body.innerHTML='<iframe id="replacement-owned" class="ans-attach-online ans-insertvideo-online"></iframe>';
  const doc=f.root.querySelector('iframe').contentDocument,m=doc.createElement('video');let calls=0,paused=true;
  m.id='video_html5_api';m.src='https://invalid.example/replacement';Object.defineProperties(m,{readyState:{value:4},paused:{get:()=>paused}});
  m.play=()=>{calls++;paused=false;return Promise.resolve();};m.pause=()=>{paused=true;};doc.body.append(m);
  await f.tick(500);assert.equal(calls,1);assert.equal(f.controls[0].calls,1);f.close();
});
