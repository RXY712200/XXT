import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { clock,microtasks } from './support.js';
import { bootstrap } from '../src/runtime/browser.js';
import { defaults } from '../src/runtime/preferences.js';
import { createInventoryReader } from '../src/platform/inventory.js';
import { createCoordinator } from '../src/core/coordinator.js';
import { createNativeNavigation } from '../src/runtime/native-navigation.js';
import { createDiagnostics } from '../src/runtime/diagnostics.js';
import { createArtifact } from '../scripts/build-userscript.mjs';
const html=readFileSync(new URL('../fixtures/synthetic/completed-assessment-handoff.html',import.meta.url),'utf8');

function fixture({generated=false,delay=0,settings={},prepare=()=>{}}={}){
  const dom=new JSDOM(html,{url:'https://mooc1.chaoxing.com/mycourse/studentstudy?courseid=synthetic-navigation',runScripts:'outside-only'}),document=dom.window.document,time=clock();let plays=0;
  const content=(name='source')=>{
    const root=document.querySelector('iframe[info=card]').contentDocument;
    root.body.innerHTML=`<p>任务点已完成</p><section class="ans-attach-ct"><span class="ans-job-icon ans-job-finished"></span><iframe class="ans-attach-online ans-insertvideo-online" id="owned-${name}" data='{"objectid":"synthetic-${name}"}'></iframe></section>`;
    const doc=root.querySelector('iframe').contentDocument;doc.body.innerHTML=`<video id="video_html5_api" src="https://invalid.example/${name}"></video>`;
    const player=doc.querySelector('video');let paused=true;Object.defineProperty(player,'paused',{get:()=>paused});player.play=()=>{plays++;paused=false;return Promise.resolve();};player.pause=()=>{paused=true;};
    return {root,player};
  };
  content();prepare({document,dom,content});
  dom.window.localStorage.setItem('xxt.state.v1',JSON.stringify({version:1,settings:{...defaults,delays:delay>0,minMs:delay,maxMs:delay,...settings},stopped:false,restUntil:0,count:0,seen:[]}));
  dom.window.setTimeout=(fn,ms)=>time.setTimeout(fn,ms);dom.window.clearTimeout=id=>time.clearTimeout(id);
  let app;if(generated){dom.window.eval(createArtifact());app=dom.window.XXT;}else app=bootstrap(document,{clock:time});
  return {dom,document,time,app,content,plays:()=>plays,events:()=>JSON.parse(app.exportDiagnostics()).events,
    async tick(ms=500){time.advance(ms);await microtasks();},close(){app.dispose();dom.window.close();}};
}
function activate(f,id,{credited=false,delay=0,rebuild=false}={}){
  let count=0;const target=f.document.getElementById(id);
  target.onclick=()=>{
    count++;f.document.querySelector('.prev_title').title='视频';f.document.querySelector('.posCatalog_active').classList.remove('posCatalog_active');target.classList.add('posCatalog_active');
    if(credited){target.querySelector('input').value='0';target.insertAdjacentHTML('beforeend','<span class="icon_Completed"></span>');}
    const load=()=>{
      f.content(id);
      if(rebuild){const tree=f.document.getElementById('coursetree');tree.replaceWith(tree.cloneNode(true));}
    };
    if(delay)f.time.setTimeout(load,delay);else load();
  };
  return ()=>count;
}

for(const generated of [false,true])test(`${generated?'generated':'module'} credited video defers same-chapter assessment, acknowledges one native target and continues credited content`,async()=>{
  const f=fixture({generated});let examClicks=0;f.document.getElementById('assessment').onclick=()=>examClicks++;
  const first=activate(f,'learning',{credited:true});const second=activate(f,'following');
  await f.tick();assert.equal(first(),1);assert.equal(f.document.querySelector('.posCatalog_active').id,'learning');
  await f.tick();assert.equal(second(),1);assert.equal(f.document.querySelector('.posCatalog_active').id,'following');
  assert.equal(examClicks,0);assert.equal(f.document.querySelector('#assessment input').value,'1');assert.equal(f.document.querySelector('#assessment .icon_Completed'),null);assert.equal(f.plays(),0);
  const stages=f.events().filter(e=>e.category==='navigation').map(e=>e.stage);
  for(const stage of ['target-selected','permit-issued','queued','cooldown-started','cooldown-expired','permit-renewed','permit-consumed','native-activation','native-returned','destination-active','destination-content','acknowledged'])assert.ok(stages.includes(stage),stage);
  assert.equal(stages.filter(s=>s==='native-activation').length,2);assert.equal(stages.filter(s=>s==='acknowledged').length,2);
  assert.ok(f.events().filter(e=>e.category==='navigation').every(e=>e.state!=='OTHER'&&e.kind==='video'));f.close();
});

test('bounded consecutive optional assessments support same and next chapter; mandatory/unknown/restricted boundaries do not',async()=>{
  for(const mode of ['consecutive','cross','unknown-title','mandatory','restricted','verification','unknown-task','limit']){
    const f=fixture({prepare({document}){
      if(mode==='consecutive'||mode==='limit')for(let n=0;n<(mode==='limit'?9:1);n++){const li=document.createElement('li');li.innerHTML=`<div id="extra-${n}" class="posCatalog_select"><span class="posCatalog_name">章节测试</span><input class="jobUnfinishCount" value="1"></div>`;document.getElementById('learning').closest('li').before(li);}
      if(mode==='cross')document.getElementById('learning').closest('li').remove();
      if(mode==='unknown-title'||mode==='mandatory')document.querySelector('#assessment .posCatalog_name').title=mode==='mandatory'?'期末考试':'练习测验';
      if(mode==='restricted')document.getElementById('learning').setAttribute('aria-disabled','true');
      if(mode==='verification')document.body.insertAdjacentHTML('beforeend','<form>验证码<input name="captcha"></form>');
      if(mode==='unknown-task'){const root=document.querySelector('iframe').contentDocument;root.body.insertAdjacentHTML('beforeend','<iframe class="ans-attach-online" id="unknown" data=\'{"objectid":"synthetic-unknown"}\'></iframe>');}
    }});
    let clicks=0;for(const node of f.document.querySelectorAll('.posCatalog_select'))node.onclick=()=>clicks++;
    await f.tick();assert.equal(clicks,['consecutive','cross'].includes(mode)?1:0,mode);
    assert.equal(f.document.querySelector('#assessment input').value,'1');assert.equal(f.plays(),0);f.close();
  }
});

test('delayed owned content and harmless rebuilt catalog are acknowledged using bounded shared-scheduler observation',async()=>{
  const f=fixture();const clicks=activate(f,'learning',{delay:2600,rebuild:true});await f.tick();
  assert.equal(clicks(),1);assert.equal(f.app.view().navigationStage,'destination-active');assert.equal(f.app.view().deadlineKind,'acknowledgement');
  for(let n=0;n<25;n++)await f.tick(100);
  assert.notEqual(f.app.view().navigationStage,'acknowledged');await f.tick(100);assert.equal(f.app.view().navigationStage,'acknowledged');
  assert.equal(f.document.querySelector('.posCatalog_active').id,'learning');assert.equal(clicks(),1);assert.equal(f.plays(),0);f.close();
});

test('native failure stages distinguish no acknowledgement, wrong owner, content without target, unsafe catalog and throwing activation',async()=>{
  for(const mode of ['no-ack','late-content','wrong-owner','content-only','ambiguous','throw']){
    const f=fixture();const target=f.document.getElementById('learning');let clicks=0;
    if(mode==='throw')target.click=()=>{clicks++;throw Error('arbitrary private error https://private.example/token');};
    else target.onclick=()=>{
      clicks++;
      if(mode==='wrong-owner')f.dom.window.history.replaceState(null,'','?courseid=different-synthetic-course');
      if(mode==='content-only')f.content('replacement');
      if(mode==='late-content'){f.document.querySelector('.posCatalog_active').classList.remove('posCatalog_active');target.classList.add('posCatalog_active');f.time.setTimeout(()=>f.content('too-late'),3500);}
      if(mode==='ambiguous'){const clone=target.cloneNode(true);target.after(clone);}
    };
    await f.tick();await f.tick(3000);if(mode==='late-content')await f.tick(1000);
    const expected=mode==='throw'?'native-activation-threw':mode==='wrong-owner'?'destination-mismatch':mode==='ambiguous'?'destination-unsafe':'navigation-unacknowledged';
    assert.equal(clicks,1,mode);assert.equal(f.app.view().failureCode,expected,mode);assert.ok(f.events().some(e=>e.reason===expected),mode);
    assert.ok(!f.events().some(e=>e.stage==='acknowledged'));assert.equal(f.events().filter(e=>e.stage==='native-returned').length,mode==='throw'?0:1);
    assert.equal(f.app.view().remainingMs,null);assert.ok(!f.app.exportDiagnostics().includes('private.example'));f.close();
  }
});

test('Stop cancels real navigation/start countdown and acknowledgement; reading the view never resamples delays',async()=>{
  const f=fixture({delay:5000});let clicks=0;f.document.getElementById('learning').onclick=()=>clicks++;await f.tick();
  const initial=f.app.view();assert.equal(initial.remainingMs,5000);assert.equal(initial.nextAction,'next-lesson');
  for(let n=0;n<10;n++)assert.equal(f.app.view().remainingMs,5000);
  await f.tick();assert.equal(f.app.view().remainingMs,4500);const q=f.document.getElementById('xxt-notice').shadowRoot;
  assert.match(q.querySelector('[data-countdown]').textContent,/4\.5/);assert.match(q.querySelector('[data-task]').textContent,/视频.*1\/1/);
  assert.match(q.querySelector('[data-credit]').textContent,/已独立确认/);assert.equal(f.document.getElementById('xxt-control').shadowRoot.querySelector('details').open,false);
  f.app.stop();assert.equal(f.app.view().remainingMs,null);await f.tick(6000);assert.equal(clicks,0);assert.ok(f.events().some(e=>e.stage==='cancelled'));f.close();
  const g=fixture();g.document.getElementById('learning').onclick=()=>{};await g.tick();g.app.stop();await g.tick(5000);
  assert.ok(!g.events().some(e=>e.stage==='acknowledged'||e.stage==='timeout'));assert.equal(g.app.view().remainingMs,null);g.close();
});

test('queue rejection, expired permit and target denial cannot be logged as an activation or successful queue',async()=>{
  const f=fixture(),reader=createInventoryReader(),events=[],c=createCoordinator({clock:f.time,onNavigationEvent:(stage,reason)=>events.push({stage,reason})});
  f.app.dispose();c.bind(reader.scan(f.document));const permit=c.navigationDecision('prior-credit').permit;
  const port=createNativeNavigation(f.document,reader,()=>c.snapshot().inventory);assert.equal(c.queueNavigation(permit,port,{delay:6000}),true);
  assert.equal(c.queueNavigation(permit,port,{delay:6000}),false);assert.equal(events.filter(e=>e.stage==='queued').length,1);assert.ok(events.some(e=>e.stage==='queue-rejected'));
  f.time.advance(6000);await microtasks();assert.ok(events.some(e=>e.reason==='permit-expired'));assert.ok(!events.some(e=>e.stage==='native-activation'));c.destroy();f.close();
  const g=fixture({prepare({document}){document.getElementById('learning').setAttribute('aria-disabled','true');}});await g.tick();
  assert.ok(g.events().some(e=>e.stage==='target-rejected'));assert.ok(!g.events().some(e=>e.stage==='queued'));g.close();
});

test('v1 diagnostic migration preserves unknown provenance; v2 remains bounded and rejects private fields',()=>{
  const data=new Map([['xxt.decisions.v1',JSON.stringify([{category:'navigation',state:'OTHER',kind:'unknown'}])]]),time=clock();
  const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};const log=createDiagnostics(storage,time.now);
  assert.equal(JSON.parse(log.export()).events[0].reason,'legacy-unrecorded');assert.equal(JSON.parse(log.export()).events[0].atMs,null);
  for(let n=0;n<105;n++){time.advance(1);log.add('navigation','PENDING','video',{phase:'navigating',stage:'native-returned',reason:'secret account token',outcome:'observed',deadlineKind:'acknowledgement',retry:2,url:'https://private.example/?token=secret',title:'private-user'});}
  const exported=log.export();assert.equal(JSON.parse(exported).format,'xxt-diagnostics-v2');assert.equal(JSON.parse(exported).events.length,100);assert.ok(!/secret|private|https:/.test(exported));
  const restored=createDiagnostics(storage,time.now);assert.equal(JSON.parse(restored.export()).events.length,100);restored.clear();assert.deepEqual(JSON.parse(createDiagnostics(storage).export()).events,[]);
});

test('absent credit never gets a queued action; contradictory own evidence is observed but never independently accepted',async()=>{
  const missing=fixture({prepare({document}){document.querySelector('#source .icon_Completed').remove();}});await missing.tick();
  assert.equal(missing.app.view().remainingMs,null);assert.equal(missing.app.view().platformCredit,'unconfirmed');assert.ok(!missing.events().some(e=>e.stage==='queued'));
  assert.match(missing.document.getElementById('xxt-notice').shadowRoot.querySelector('[data-countdown]').textContent,/无计时/);missing.close();
  const f=fixture();f.document.querySelector('iframe').contentDocument.querySelector('section').insertAdjacentHTML('beforeend','<input class="jobUnfinishCount" value="1">');await f.tick();
  assert.equal(f.app.view().platformCredit,'contradictory');assert.ok(f.events().some(e=>e.stage==='completion-observed'));assert.ok(!f.events().some(e=>['completion-validated','permit-issued','native-activation'].includes(e.stage)));f.close();
});

test('unique pre-click catalog reconstruction rebinds safely, but duplicate target identity cancels the old permit',async()=>{
  for(const ambiguous of [false,true]){
    const f=fixture({delay:500});await f.tick();const tree=f.document.getElementById('coursetree');tree.replaceWith(tree.cloneNode(true));
    if(ambiguous)f.document.getElementById('learning').after(f.document.getElementById('learning').cloneNode(true));
    const clicks=activate(f,'learning');await f.tick();assert.equal(clicks(),ambiguous?0:1);assert.equal(f.events().filter(e=>e.stage==='acknowledged').length,ambiguous?0:1);f.close();
  }
});

test('bottom runtime start/recovery/rest fields follow actual deadlines; countdown ticks do not announce or execute actions',async()=>{
  const uncredited=({document})=>{document.querySelector('#source .icon_Completed').remove();document.querySelector('#source input').value='1';document.querySelector('iframe').contentDocument.querySelector('.ans-job-icon').classList.remove('ans-job-finished');};
  const f=fixture({prepare:uncredited,settings:{delays:true,actionRanges:{videoStart:{enabled:true,minMs:3000,maxMs:3000}}}});
  assert.equal(f.app.view().remainingMs,3000);assert.equal(f.app.view().deadlineKind,'attachment');await f.tick();
  const quick=f.document.getElementById('xxt-notice').shadowRoot,status=quick.querySelector('[role=status]'),node=status.firstChild;
  for(const field of ['phase','task','progress','credit','local','next','countdown'])assert.ok(quick.querySelector(`[data-${field}]`).textContent);
  assert.equal(quick.querySelector('dl').getAttribute('aria-live'),'off');await f.tick();assert.equal(status.firstChild,node);assert.equal(f.app.view().remainingMs,2000);assert.equal(f.plays(),0);f.app.stop();assert.equal(f.app.view().remainingMs,null);f.close();
  const g=fixture({prepare:uncredited});await g.tick(0);g.document.querySelector('iframe').remove();await g.tick();assert.equal(g.app.view().recoveryAttempt,1);assert.equal(g.app.view().remainingMs,10000);await g.tick();assert.equal(g.app.view().remainingMs,9500);assert.match(g.document.getElementById('xxt-notice').shadowRoot.querySelector('[data-recovery]').textContent,/1\/3/);g.close();
  const h=fixture({prepare:uncredited,settings:{restEnabled:true,restCount:1,restMs:20000}});await h.tick(0);const media=h.document.querySelector('iframe').contentDocument.querySelector('iframe').contentDocument.querySelector('video');Object.defineProperty(media,'ended',{value:true});media.dispatchEvent(new h.dom.window.Event('ended'));await h.tick();
  assert.equal(h.app.view().deadlineKind,'rest');assert.equal(h.app.view().remainingMs,19500);assert.equal(h.plays(),1);h.app.stop();assert.equal(h.app.view().restRemaining,0);assert.equal(h.app.view().remainingMs,null);h.close();
});

test('an isolated optional assessment can hand off in the same chapter without any claim it was completed',async()=>{
  const f=fixture({prepare({document}){
    document.getElementById('source').classList.remove('posCatalog_active');document.getElementById('assessment').classList.add('posCatalog_active');
    document.querySelector('.prev_title').title='1.4 本章自测';document.querySelector('iframe').contentDocument.body.textContent='章节测验';
  }}),clicks=activate(f,'learning');
  assert.equal(f.app.view().platformConfirmed,false);await f.tick();assert.equal(clicks(),1);
  assert.equal(f.document.querySelector('.posCatalog_active').id,'learning');assert.equal(f.document.querySelector('#assessment input').value,'1');
  assert.ok(!f.events().some(e=>e.stage==='completion-validated'));assert.ok(f.events().some(e=>e.stage==='permit-issued'));assert.ok(f.events().some(e=>e.stage==='acknowledged'));f.close();
});
