import test from 'node:test';
import assert from 'node:assert/strict';
import { page, clock, microtasks } from './support.js';
import { bootstrap } from '../src/runtime/browser.js';
import { createInventoryReader } from '../src/platform/inventory.js';
import { createCoordinator } from '../src/core/coordinator.js';
import { createPartialStore } from '../src/runtime/partial.js';
import { defaults } from '../src/runtime/preferences.js';

// Independent inert fixtures, real runtime/coordinator/storage paths. Playback
// properties and events are simulated; no authenticated session or browser grant.
const partialKey='xxt.partial-session.v1', recoveryKey='xxt.unattended-recovery.v1';
function player(media) {
  const state={calls:0,pauses:0,paused:true,ended:false,currentTime:0};
  for(const key of ['paused','ended','currentTime'])Object.defineProperty(media,key,{configurable:true,get:()=>state[key]});
  media.play=()=>{state.calls++;state.paused=false;return Promise.resolve();};
  media.pause=()=>{state.pauses++;state.paused=true;};
  return state;
}
function fixture(kinds=['video'],{ui=false,completed=[]}={}) {
  const f=page(kinds,{completed}),time=clock();
  const controls=f.players.map(m=>m&&player(m));
  f.dom.window.localStorage.setItem('xxt.state.v1',JSON.stringify({version:1,settings:{...defaults,delays:false},stopped:false,restUntil:0,count:0,seen:[]}));
  let app=bootstrap(f.document,{clock:time,ui});
  return {...f,time,controls,get app(){return app;},
    async tick(ms=500){time.advance(ms);await microtasks();},
    end(index=0){controls[index].ended=true;f.players[index].dispatchEvent(new f.dom.window.Event('ended'));},
    reload(){app.dispose();app=bootstrap(f.document,{clock:time,ui});},
    stored(key=partialKey){return f.dom.window.localStorage.getItem(key);},
    stopped(){return JSON.parse(f.dom.window.localStorage.getItem('xxt.state.v1')).stopped;},
    close(){app.dispose();f.dom.window.close();}};
}
function detachCard(f) {
  const old=f.document.querySelector('iframe[info=card]');
  const html=old.contentDocument.body.innerHTML;
  const bodies=[...old.contentDocument.querySelectorAll('iframe')].map(frame=>frame.contentDocument.body.innerHTML);
  old.remove();
  return function rebuild({source=null,identity=null}={}) {
    const frame=f.document.createElement('iframe');frame.setAttribute('info','card');f.document.body.append(frame);
    const root=frame.contentDocument;root.body.innerHTML=html;
    const states=[...root.querySelectorAll('iframe')].map((owner,i)=>{
      owner.contentDocument.body.innerHTML=bodies[i];
      if(identity)owner.setAttribute('data',JSON.stringify({objectid:identity}));
      const media=owner.contentDocument.querySelector('video,audio');if(source&&media)media.src=source;
      return media?player(media):null;
    });
    return {frame,root,states};
  };
}

test('unfinished same-lesson missing card cancels old effects and starts only equivalent fresh owned media',async()=>{
  const f=fixture();await f.tick(0);assert.equal(f.controls[0].calls,1);
  const rebuild=detachCard(f);await f.tick();assert.equal(f.stopped(),false);assert.match(f.app.view().message,/框架重建/);
  assert.equal(JSON.parse(f.dom.window.sessionStorage.getItem(recoveryKey)).attempts,1);
  const next=rebuild();await f.tick();await f.tick(0);assert.equal(next.states[0].calls,1);assert.equal(f.controls[0].calls,1);
  f.end();for(const callback of [...f.time.cancelled])callback();await microtasks();
  assert.equal(f.controls[0].calls,1);assert.equal(next.states[0].calls,1);assert.equal(f.app.view().localDone,false);assert.equal(f.app.view().platformConfirmed,false);f.close();
});

test('equivalent owned attachment can finish rebuilding inside an unchanged card',async()=>{
  const f=fixture();await f.tick(0);const owner=f.owners[0],body=owner.contentDocument.body.innerHTML,replacement=owner.cloneNode();owner.replaceWith(replacement);
  await f.tick();assert.equal(f.stopped(),false);replacement.contentDocument.body.innerHTML=body;const fresh=player(replacement.contentDocument.querySelector('video'));
  await f.tick();await f.tick(0);assert.equal(fresh.calls,1);assert.equal(f.controls[0].calls,1);f.close();
});

test('same-lesson loading recovery rejects changed attachment or media-source identity',async()=>{
  for(const change of [{source:'https://invalid.example/different'},{identity:'different-content'}]){
    const f=fixture();await f.tick(0);const rebuild=detachCard(f);await f.tick();const next=rebuild(change);await f.tick();
    assert.equal(f.stopped(),true);assert.equal(next.states[0].calls,0);assert.equal(f.controls[0].calls,1);assert.equal(f.app.view().platformConfirmed,false);f.close();
  }
});

test('reconstruction deadline, verification and Stop cancel waiting without obsolete replay',async()=>{
  for(const mode of ['deadline','verification','stop']){
    const f=fixture();await f.tick(0);const rebuild=detachCard(f);await f.tick();
    if(mode==='verification')f.document.body.insertAdjacentHTML('beforeend','<form>验证码<input name="captcha"></form>');
    if(mode==='stop')f.app.stop();
    await f.tick(mode==='deadline'?10000:500);assert.equal(f.stopped(),true);
    const next=rebuild();await f.tick(1000);for(const callback of [...f.time.cancelled])callback();await microtasks();
    assert.equal(next.states[0].calls,0);assert.equal(f.controls[0].calls,1);f.close();
  }
});

test('loading reconstruction consumes persisted finite budget and terminal state survives reinjection',async()=>{
  const f=fixture();await f.tick(0);
  for(let n=1;n<=2;n++){const rebuild=detachCard(f);await f.tick();assert.equal(JSON.parse(f.dom.window.sessionStorage.getItem(recoveryKey)).attempts,n);const next=rebuild();await f.tick();await f.tick(0);assert.equal(next.states[0].calls,1);}
  const rebuild=detachCard(f);await f.tick();assert.equal(JSON.parse(f.dom.window.sessionStorage.getItem(recoveryKey)).stage,'terminal');
  const next=rebuild();f.reload();await f.tick(1000);assert.equal(next.states[0].calls,0);assert.match(f.app.view().message,/终止/);f.close();
});

test('local-ended uncredited reconstruction and reload show restored waiting without replay or navigation',async()=>{
  const f=fixture(['video'],{ui:true});let clicks=0;f.document.querySelector('#unit-0-1').onclick=()=>clicks++;
  await f.tick(0);f.end();await f.tick(0);const rebuild=detachCard(f);await f.tick();const next=rebuild();await f.tick();
  assert.equal(next.states[0].calls,0);assert.equal(f.app.view().taskState,'RESTORED_WAITING_PLATFORM');
  f.reload();await f.tick();assert.equal(f.app.view().taskState,'RESTORED_WAITING_PLATFORM');assert.equal(f.app.view().localDone,true);assert.equal(f.app.view().platformConfirmed,false);
  const status=f.document.querySelector('#xxt-control').shadowRoot.querySelector('#status').textContent;
  assert.match(status,/已恢复本地结束记录/);assert.match(status,/已处理，非平台完成/);assert.match(status,/平台信用：未确认/);
  // Restored local evidence still cannot authorize navigation. Fresh independent
  // whole-lesson proof may use the same prior-credit gate as a fresh page entry.
  f.markLesson();await f.tick(1000);assert.equal(clicks,1);assert.equal(next.states[0].calls,0);
  f.app.stop();f.reload();await f.tick();assert.equal(next.states[0].calls,0);assert.match(f.app.view().message,/停止/);f.app.resume();await f.tick(0);assert.equal(f.app.view().taskState,'RESTORED_WAITING_PLATFORM');assert.equal(next.states[0].calls,0);f.close();
});

test('restored local state is distinct from fresh pending, with no invented RUNNING or ended history',()=>{
  const f=page(['video','audio']),reader=createInventoryReader(),inventory=reader.scan(f.document),c=createCoordinator();c.bind(inventory);
  c.restorePartial({ended:[inventory.tasks[0].key],deferred:[]});
  assert.equal(c.snapshot().records[0].state,'RESTORED_WAITING_PLATFORM');assert.equal(c.snapshot().records[1].state,'PENDING');
  assert.deepEqual(c.snapshot().records[0].history,['DISCOVERED','PENDING','RESTORED_WAITING_PLATFORM']);
  assert.deepEqual(c.snapshot().records.map(r=>r.key),inventory.tasks.map(t=>t.key));assert.equal(c.navigationDecision().allowed,false);c.destroy();f.dom.window.close();
});

test('reload with independent task and whole-lesson credit can use original completion gate without replay',async()=>{
  const f=fixture();await f.tick(0);f.end();await f.tick(0);
  f.owners[0].parentElement.querySelector('.ans-job-icon').classList.add('ans-job-finished');f.markLesson();let clicks=0;f.document.querySelector('#unit-0-1').onclick=()=>clicks++;
  f.reload();await f.tick();assert.equal(clicks,1);assert.equal(f.controls[0].calls,1);assert.equal(f.app.view().platformConfirmed,true);f.close();
});

test('busy explicit deferral never writes storage or survives a rejected attempt across reload',async()=>{
  const f=fixture(['video','unknown','audio']);await f.tick(0);const before=f.stored();
  assert.throws(()=>f.app.deferUnknown(),/busy/);assert.equal(f.stored(),before);
  f.reload();await f.tick(0);f.end();await f.tick();assert.equal(f.controls[2].calls,0);assert.deepEqual(JSON.parse(f.stored()).deferred,[]);
  f.app.deferUnknown();await f.tick(0);assert.equal(f.controls[2].calls,1);f.end(2);await f.tick(0);f.reload();await f.tick();
  assert.equal(f.controls[2].calls,1);assert.equal(f.app.view().platformConfirmed,false);assert.equal(JSON.parse(f.stored()).deferred.length,1);f.close();
});

test('queued and active navigation reject deferral before any persistence callback',async()=>{
  const f=page(),time=clock(),c=createCoordinator({clock:time}),inventory=createInventoryReader().scan(f.document);f.markLesson();c.bind(inventory);const decision=c.navigationDecision('prior-credit');assert.equal(decision.allowed,true);
  let writes=0,activations=0;c.queueNavigation(decision.permit,{activate(){activations++;return new Promise(()=>{});}},{delay:100});
  assert.equal(c.deferUnknown(inventory,()=>writes++),false);time.advance(100);await microtasks();assert.equal(activations,1);
  assert.equal(c.deferUnknown(inventory,()=>writes++),false);assert.equal(writes,0);c.destroy();f.dom.window.close();
});

test('failed deferral write grants neither memory nor durable authority; explicit idle retry applies exact keys',async()=>{
  const f=fixture(['video','unknown','audio']);await f.tick(0);f.end();await f.tick();const before=f.stored();
  const prototype=f.dom.window.Storage.prototype,original=prototype.setItem;let reject=true;
  prototype.setItem=function(key,value){if(reject&&key===partialKey)throw Error('synthetic write denial');return original.call(this,key,value);};
  assert.throws(()=>f.app.deferUnknown(),/write denial/);assert.equal(f.stored(),before);await f.tick();assert.equal(f.controls[2].calls,0);
  reject=false;f.reload();await f.tick();assert.equal(f.controls[2].calls,0);assert.deepEqual(JSON.parse(f.stored()).deferred,[]);
  f.app.deferUnknown();await f.tick(0);assert.equal(f.controls[2].calls,1);assert.deepEqual(JSON.parse(f.stored()).deferred,createInventoryReader().scan(f.document).tasks.filter(t=>t.kind==='unknown').map(t=>t.key));
  prototype.setItem=original;f.close();
});

test('changed deferral scope cannot persist; explicit corrected-task recheck retains only exact local identities',async()=>{
  const f=fixture(['video','unknown','audio']);await f.tick(0);f.end();await f.tick();const before=f.stored();
  const owner=f.owners[1];owner.classList.add('ans-insertaudio');owner.contentDocument.body.innerHTML='<audio id="audio_html5_api" src="https://invalid.example/corrected"></audio>';const corrected=player(owner.contentDocument.querySelector('audio'));
  assert.throws(()=>f.app.deferUnknown(),/unsafe/);assert.equal(f.stored(),before);f.app.rescan();await f.tick(0);
  assert.equal(corrected.calls,1);assert.equal(f.controls[0].calls,1);assert.equal(f.app.view().task.ordinal,1);assert.equal(f.app.view().platformConfirmed,false);f.close();
  // A failed store write must also leave the store object's private copy intact.
  const raw=page(['video','unknown']),inventory=createInventoryReader().scan(raw.document),data=new Map();let reject=false;
  const storage={getItem:k=>data.get(k)||null,setItem(k,v){if(reject)throw Error('denied');data.set(k,v);}},store=createPartialStore(storage);store.bind(inventory);reject=true;assert.throws(()=>store.defer(inventory));reject=false;
  store.record(inventory.tasks[0]);assert.deepEqual(JSON.parse(data.get(partialKey)).deferred,[]);
  assert.deepEqual(store.bind(inventory).deferred,[]);raw.dom.window.close();
});
