import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { page,clock,microtasks } from './support.js';
import { bootstrap } from '../src/runtime/browser.js';
import { createInventoryReader } from '../src/platform/inventory.js';
import { createCoordinator } from '../src/core/coordinator.js';
import { createPartialStore } from '../src/runtime/partial.js';
import { createUnattendedRecoveryCoordinator } from '../src/runtime/fork-recovery.js';
import { createReplayLifecycle } from '../src/runtime/replay-lifecycle.js';
import { createDiagnostics } from '../src/runtime/diagnostics.js';
import { defaults,actionCategories,sampleDelay,createPreferences } from '../src/runtime/preferences.js';
import { createDocumentAdapter } from '../src/adapters/document.js';
import { createArtifact } from '../scripts/build-userscript.mjs';

// Independent adaptations of navigation/audio-failure/GM/bridge/native-entry/
// recorded-live/task-pacing/customization/preserved historical assertions.
// Real XXT APIs and generated entrypoint; no authenticated captures or old globals.
function stateStore(window,settings={}){window.localStorage.setItem('xxt.state.v1',JSON.stringify({version:1,settings:{...defaults,delays:false,...settings},stopped:false,count:0,seen:[],restUntil:0}));}
function media(player){const s={calls:0,paused:true,ended:false,currentTime:0};for(const k of ['paused','ended','currentTime'])Object.defineProperty(player,k,{get:()=>s[k],configurable:true});player.play=()=>{s.calls++;s.paused=false;return Promise.resolve();};player.pause=()=>{s.paused=true;};return s;}
async function step(time,n=1){for(let i=0;i<n;i++){time.advance(500);await microtasks();}}
function cloneContent(document,html,bodies){const root=document.querySelector('iframe[info=card]').contentDocument;root.body.innerHTML=html;[...root.querySelectorAll('iframe')].forEach((el,i)=>{el.contentDocument.body.innerHTML=bodies[i];});return root;}

test('generated runtime: credited video still present survives delayed iframe/catalog replacement and navigates once',async()=>{
 const f=page(['video'],{completed:[0]});f.markLesson();f.document.querySelector('.posCatalog_active input').setAttribute('value','0');f.root.body.prepend(Object.assign(f.root.createElement('p'),{textContent:'任务点已完成'}));
 const html=f.root.body.innerHTML,bodies=f.owners.map(o=>o.contentDocument.body.innerHTML);
 const dom=new JSDOM(f.document.documentElement.outerHTML,{url:f.document.URL,runScripts:'outside-only'});f.dom.window.close();const d=dom.window.document,t=clock();cloneContent(d,html,bodies);
 let replays=0,clicks=0;const watch=()=>{const p=d.querySelector('iframe').contentDocument.querySelector('iframe').contentDocument.querySelector('video');p.play=()=>{replays++;return Promise.resolve();};p.pause=()=>{};};watch();
 dom.window.setTimeout=(fn,ms)=>t.setTimeout(fn,ms);dom.window.clearTimeout=id=>t.clearTimeout(id);stateStore(dom.window,{delays:true,minMs:1000,maxMs:1000});dom.window.eval(createArtifact());
 await step(t); // queues original navigation permit
 const old=d.querySelector('iframe[info=card]'),replacement=old.cloneNode();old.remove();await step(t);d.body.append(replacement);cloneContent(d,html,bodies);watch();const tree=d.querySelector('#coursetree');tree.replaceWith(tree.cloneNode(true));
 const target=d.querySelector('#unit-0-1');target.onclick=()=>{clicks++;d.querySelector('.posCatalog_active').classList.remove('posCatalog_active');target.classList.add('posCatalog_active');cloneContent(d,'<iframe id="fresh" class="ans-attach-online ans-insertvideo-online"></iframe>',['<video id="video_html5_api" src="https://invalid.example/new"></video>']);const p=d.querySelector('iframe').contentDocument.querySelector('iframe').contentDocument.querySelector('video');media(p);};
 await step(t,7);assert.equal(replays,0);assert.equal(clicks,1);assert.equal(d.querySelector('.posCatalog_active'),target);assert.equal(dom.window.XXT.view().platformConfirmed,false);assert.equal(JSON.parse(dom.window.localStorage.getItem('xxt.state.v1')).stopped,false);
 dom.window.XXT.dispose();dom.window.close();
});

test('manual unknown deferral preserves ordinals and unresolved authority across durable reload',async()=>{
 const f=page(['video','unknown','audio']),t=clock(),reader=createInventoryReader(),store=createPartialStore(f.dom.window.localStorage);let starts=[],contexts=[];
 function coordinator(){return createCoordinator({clock:t,autoContinue:true,adapters:Object.fromEntries(['video','audio'].map(kind=>[kind,{recognize:()=>true,start(ctx){starts.push(ctx.task.ordinal);contexts.push(ctx);return {cancel(){}};}}])),onLocalResult:task=>store.record(task)});}
 let c=coordinator(),inventory=reader.scan(f.document);c.bind(inventory);c.restorePartial(store.bind(inventory));c.startNext();t.advance(0);await microtasks();contexts[0].done();t.advance(0);await microtasks();assert.deepEqual(starts,[0]);
 c.restorePartial(store.defer(inventory));c.startNext();t.advance(0);await microtasks();assert.deepEqual(starts,[0,2]);contexts[1].done();assert.equal(c.navigationDecision().allowed,false);c.destroy();
 c=coordinator();inventory=reader.scan(f.document);c.bind(inventory);c.restorePartial(createPartialStore(f.dom.window.localStorage).bind(inventory));c.startNext();assert.deepEqual(starts,[0,2]);assert.equal(c.navigationDecision('prior-credit').allowed,false);assert.equal(c.snapshot().records[1].kind,'unknown');c.stop();assert.equal(c.startNext(),false);c.destroy();f.dom.window.close();
});

test('changed partial scope requires explicit recheck and cannot transfer local evidence',()=>{
 const f=page(['unknown']),reader=createInventoryReader(),store=createPartialStore(f.dom.window.localStorage),old=reader.scan(f.document);store.bind(old);store.defer(old);
 f.owners[0].classList.add('ans-insertaudio');f.owners[0].contentDocument.body.innerHTML='<audio id="audio_html5_api" src="https://invalid.example/audio"></audio>';
 const next=reader.scan(f.document);assert.throws(()=>store.bind(next),/partial-scope/);assert.deepEqual(store.bind(next,{recheck:true}),{ended:[],deferred:[]});f.dom.window.close();
});

test('actual app persists mixed local results and explicit deferral without replay or journal navigation authority',async()=>{
 const f=page(['video','unknown','audio']),t=clock(),controls=f.players.map(p=>p&&media(p));stateStore(f.dom.window);let clicks=0;f.document.querySelector('#unit-0-1').onclick=()=>clicks++;
 let app=bootstrap(f.document,{clock:t,ui:false});t.advance(0);await microtasks();controls[0].ended=true;f.players[0].dispatchEvent(new f.dom.window.Event('ended'));await step(t);assert.equal(controls[2].calls,0);
 app.deferUnknown();t.advance(0);await microtasks();assert.equal(controls[2].calls,1);controls[2].ended=true;f.players[2].dispatchEvent(new f.dom.window.Event('ended'));await step(t);app.dispose();
 app=bootstrap(f.document,{clock:t,ui:false});await step(t,2);assert.equal(controls[0].calls,1);assert.equal(controls[2].calls,1);assert.equal(clicks,0);assert.equal(app.view().platformConfirmed,false);assert.equal(JSON.parse(f.dom.window.localStorage.getItem('xxt.state.v1')).count,2);
 f.owners[1].classList.add('ans-insertaudio');f.owners[1].contentDocument.body.innerHTML='<audio id="audio_html5_api" src="https://invalid.example/corrected"></audio>';const fixed=media(f.owners[1].contentDocument.querySelector('audio'));
 app.rescan();t.advance(0);await microtasks();assert.equal(fixed.calls,1);assert.equal(controls[0].calls,1);assert.equal(controls[2].calls,1);app.stop();app.dispose();f.dom.window.close();
});

test('real app credit negatives and unacknowledged native navigation stay safe',async()=>{
 for(const mode of ['text-only','sibling','contradiction','unknown','verification','active','timeout']){
  const f=page(mode==='unknown'?['unknown']:['video']),t=clock();stateStore(f.dom.window);if(f.players[0])media(f.players[0]);let clicks=0;f.document.querySelector('#unit-0-1').onclick=()=>clicks++;
  f.root.body.prepend(Object.assign(f.root.createElement('p'),{textContent:'任务点已完成'}));
  if(mode==='sibling')f.markLesson(f.document.querySelector('#unit-0-1'));else if(mode!=='text-only')f.markLesson();
  if(mode==='contradiction')f.document.querySelector('.posCatalog_active input').value='1';
  if(mode==='verification')f.root.body.insertAdjacentHTML('beforeend','<form>验证码<input name="captcha"></form>');
  if(mode==='active'){const a=f.root.createElement('audio');f.root.body.append(a);Object.defineProperty(a,'paused',{value:false});}
  const app=bootstrap(f.document,{clock:t,ui:false});await step(t,10);assert.equal(clicks,mode==='timeout'?1:0,mode);if(mode==='timeout')assert.equal(JSON.parse(f.dom.window.localStorage.getItem('xxt.state.v1')).stopped,true);app.dispose();f.dom.window.close();
 }
});

test('terminal recovery survives actual app reload/reinjection, missing identity and explicit Stop',async()=>{
 const f=page(),t=clock(),reader=createInventoryReader(),id=JSON.stringify([reader.scan(f.document).courseKey,reader.scan(f.document).lesson.key]);const p=media(f.players[0]);stateStore(f.dom.window);
 const terminal={version:1,identity:id,attempts:3,stage:'terminal',reloadUsed:false,reason:'budget',stopped:false,cycle:0};f.dom.window.sessionStorage.setItem('xxt.unattended-recovery.v1',JSON.stringify(terminal));
 let app=bootstrap(f.document,{clock:t,ui:false});await step(t,4);assert.equal(p.calls,0);assert.equal(bootstrap(f.document,{clock:t,ui:false}),app);app.dispose();
 app=bootstrap(f.document,{clock:t,ui:false});await step(t);assert.equal(p.calls,0);app.start();t.advance(0);await microtasks();assert.equal(p.calls,1);app.stop();app.dispose();
 app=bootstrap(f.document,{clock:t,ui:false});await step(t);assert.equal(p.calls,1);app.dispose();f.dom.window.close();
});

test('extracted recovery reaches terminal at attempt three; stale progress cannot reset; new verified identity can',()=>{
 const t=clock(),map=new Map();let id='course/one',retries=0,failed=0;
 const env={sessionStorage:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)},now:t.now,setTimeout:t.setTimeout,clearTimeout:t.clearTimeout,location:{reload(){assert.fail('no reload');}}};
 const hooks={identity:()=>id,safe:()=>true,notice(){},fail(){failed++;},canReload:()=>false,fingerprint:()=>id,progress:()=>false,retry(){retries++;}};
 const r=createUnattendedRecoveryCoordinator(env,hooks);r.requestRecovery('frame-replaced');t.advance(34000);assert.equal(r.getStatus().attempts,3);assert.equal(r.getStatus().stage,'terminal');assert.equal(retries,2);assert.equal(failed,1);r.confirmProgress();assert.equal(r.getStatus().stage,'terminal');
 id=null;r.restore();assert.equal(r.getStatus().stage,'terminal');id='course/one';r.restore();assert.equal(r.requestRecovery('readiness'),false);id='course/two';r.restore();assert.equal(r.getStatus().attempts,0);assert.equal(r.requestRecovery('readiness'),true);r.markExplicitStop();r.confirmProgress();assert.equal(r.getStatus().stopped,true);r.dispose();
});

test('adaptive reader samples 5000–7000ms, progresses incrementally and still needs platform credit',async()=>{
 for(const draw of [0,0.999999]){const f=page(['document']),t=clock(),doc=f.owners[0].contentDocument,viewer=doc.createElement('div');viewer.style.overflowY='auto';doc.body.append(viewer);let top=0;const moves=[];
 Object.defineProperties(viewer,{scrollHeight:{value:1100},clientHeight:{value:100},scrollTop:{get:()=>top,set:value=>{top=value;moves.push({at:t.now(),value});}}});
 const c=createCoordinator({clock:t,adapters:{document:createDocumentAdapter({random:()=>draw})}});c.bind(createInventoryReader().scan(f.document));c.startNext();t.advance(0);await microtasks();await step(t,8);assert.ok(top>0&&top<1000);await step(t,12);assert.equal(top,1000);const reached=moves.find(m=>m.value===1000).at;assert.ok(reached>=5000&&reached<=8000);assert.equal(c.snapshot().records[0].state,'WAITING_PLATFORM');assert.equal(c.navigationDecision().allowed,false);c.destroy();f.dom.window.close();}
});

test('per-action inclusive integer samples, saved false/Stop, disabled category and sanitized durable journal',()=>{
 const f=page(),prefs=createPreferences(f.dom.window.localStorage);prefs.update({navigation:false,actionRanges:Object.fromEntries(actionCategories.map(k=>[k,{enabled:true,minMs:321,maxMs:987}]))});prefs.stop();
 const restored=createPreferences(f.dom.window.localStorage);assert.equal(restored.snapshot().stopped,true);assert.equal(restored.snapshot().settings.navigation,false);
 for(const category of actionCategories){assert.equal(sampleDelay(restored.snapshot().settings,()=>0,category),321);assert.equal(sampleDelay(restored.snapshot().settings,()=>0.999999,category),987);}
 let draw=0;assert.notEqual(sampleDelay(restored.snapshot().settings,()=>draw+=0.1,'nextChapter'),sampleDelay(restored.snapshot().settings,()=>draw+=0.1,'nextChapter'));
 prefs.update({actionRanges:{assessment:{enabled:false,minMs:1,maxMs:2}}});assert.equal(sampleDelay(prefs.snapshot().settings,()=>assert.fail('no draw'),'assessment'),0);assert.throws(()=>prefs.update({actionRanges:{audioStart:{enabled:true,minMs:2,maxMs:1}}}));
 const log=createDiagnostics(f.dom.window.localStorage);for(let i=0;i<105;i++)log.add('manual','UNSUPPORTED','unknown');log.add('https://private.example/?token=secret');const saved=createDiagnostics(f.dom.window.localStorage).export();assert.equal(JSON.parse(saved).events.length,100);assert.ok(!saved.includes('secret'));log.clear();assert.equal(JSON.parse(createDiagnostics(f.dom.window.localStorage).export()).events.length,0);f.dom.window.close();
});

test('durable rest replaces one short delay and content identities never collide across media kinds',()=>{
 const f=page(),t=clock(),p=createPreferences(f.dom.window.localStorage,t.now);p.update({restEnabled:true,restCount:1,restMs:1000});
 assert.equal(p.record('video:owned-content','video'),true);assert.equal(p.record('video:owned-content','video'),false);assert.equal(p.consumeRest(),false);t.advance(1000);
 const restored=createPreferences(f.dom.window.localStorage,t.now);assert.equal(restored.consumeRest(),true);assert.equal(restored.consumeRest(),false);assert.equal(createPreferences(f.dom.window.localStorage,t.now).snapshot().restUntil,0);
 const inv=createInventoryReader().scan(f.document),video=inv.tasks[0].key;const a=page(['audio']),audio=createInventoryReader().scan(a.document).tasks[0].key;assert.notEqual(video,audio);a.dom.window.close();f.dom.window.close();
});

function replay(){const map=new Map();let at=0,seq=0;const content={course:'synthetic-course',lesson:'synthetic-lesson',item:'unique-native-card:0'};const api=createReplayLifecycle({storage:{get:(k,d)=>map.get(k)??d,set:(k,v)=>map.set(k,structuredClone(v)),remove:k=>map.delete(k)},now:()=>at,randomId:()=>`attempt-${++seq}`,verifyContext:c=>c.course===content.course&&c.lesson===content.lesson&&c.item===content.item});return {api,content,advance:n=>at+=n};}
test('adapted GM claim/ack, separate child liveness, natural-ended gate and one refresh',()=>{
 const {api,content,advance}=replay(),r=api.begin(content);assert.ok(r);assert.equal(api.begin(content),null);assert.equal(api.claim({...content,lesson:'wrong'},'child'),false);assert.equal(api.claim(content,'child'),true);assert.equal(api.claim(content,'other'),false);assert.equal(api.tick(content).phase,'active');
 advance(7200000);assert.equal(api.heartbeat(r.id,'child'),true);assert.equal(api.tick(content).phase,'active');assert.equal(api.ended(content,r.id,'child',()=>false),false);assert.equal(api.ended(content,r.id,'other',()=>true),false);assert.equal(api.ended(content,r.id,'child',()=>true),true);assert.equal(api.ended(content,r.id,'child',()=>true),false);
 assert.equal(api.verify(content,()=>false),'refresh-once');assert.equal(api.verify(content,()=>false),'manual');assert.equal(api.verify(content,()=>true),'credited');advance(14400001);assert.equal(api.begin(content,{explicit:true}),null);
});
test('adapted GM timeout/early disappearance allow explicit retry but never displace an active child',()=>{
 const {api,content,advance}=replay();const first=api.begin(content);advance(120001);assert.equal(api.tick(content).phase,'cancelled');assert.equal(api.begin(content),null);const second=api.begin(content,{explicit:true});assert.notEqual(first.id,second.id);api.claim(content,'child');api.tick(content);assert.equal(api.begin(content,{explicit:true}),null);advance(180001);assert.equal(api.tick(content).reason,'child-inactive');const third=api.begin(content,{explicit:true});assert.ok(third);assert.equal(api.heartbeat(second.id,'child'),false);advance(14400001);assert.ok(api.begin(content,{explicit:true}));
});
