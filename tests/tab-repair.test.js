import test from 'node:test';
import assert from 'node:assert/strict';
import { page,clock,microtasks } from './support.js';
import { bootstrap } from '../src/runtime/browser.js';
import { defaults } from '../src/runtime/preferences.js';
import { currentStepTitle,isActiveVideoTab } from '../src/runtime/native-tabs.js';

function setup(persistedStop = true, lateTab = false) {
 const f=page([]),time=clock();f.document.querySelector('.prev_title').title='学习目标';f.document.body.insertAdjacentHTML('beforeend','<button class="prev_white">视频</button>');
 let value=JSON.stringify({version:1,settings:{...defaults,delays:false},stopped:persistedStop,restUntil:0,count:0,seen:[]}),clicks=0,plays=0;
 const storage={getItem:()=>value,setItem(k,v){value=v;}};
 f.document.querySelector('.prev_white').addEventListener('click',()=>clicks++);
 const tab=f.document.querySelector('.prev_white');if(lateTab)tab.remove();
 const app=bootstrap(f.document,{clock:time,storage,ui:false});if(lateTab)f.document.body.append(tab);
 function render(){f.document.querySelector('.prev_title').title='视频';f.root.body.innerHTML='<iframe id="loaded" class="ans-attach-online ans-insertvideo-online"></iframe>';
 const d=f.root.querySelector('iframe').contentDocument,m=d.createElement('video');m.id='video_html5_api';m.src='https://invalid.example/owned';let paused=true;
 Object.defineProperties(m,{readyState:{value:4},paused:{get:()=>paused}});m.play=()=>{plays++;paused=false;return Promise.resolve();};m.pause=()=>{paused=true;};d.body.append(m);}
 return {...f,time,app,render,storage,clicks:()=>clicks,plays:()=>plays,async tick(ms){time.advance(ms);await microtasks();},close(){app.dispose();f.dom.window.close();}};
}
test('explicit Start Resume Rescan share safe loading objective activation and suppress repeated calls',async()=>{
 for(const method of ['start','resume','rescan']){const f=setup(method!=='rescan',method==='rescan');assert.equal(f.clicks(),0);assert.equal(f.app[method](),true);assert.equal(f.clicks(),1);
 f.app.start();f.app.resume();f.app.rescan();assert.equal(f.clicks(),1);f.render();await f.tick(500);assert.equal(f.plays(),1);assert.equal(f.app.view().platformConfirmed,false);f.close();}
});
test('Stop during objective acknowledgement remains stopped and ambiguous or missing targets never clear Stop',async()=>{
 const f=setup();f.app.start();f.app.stop();assert.equal(f.app.rescan(),false);f.render();await f.tick(11000);assert.equal(f.plays(),0);assert.equal(JSON.parse(f.storage.getItem()).stopped,true);f.close();
 for(const mode of ['missing','ambiguous']){const g=setup();if(mode==='missing')g.document.querySelector('.prev_white').remove();else g.document.body.insertAdjacentHTML('beforeend','<button class="prev_white">视频</button>');
 assert.equal(g.app.start(),false);assert.equal(g.clicks(),0);assert.equal(JSON.parse(g.storage.getItem()).stopped,true);g.close();}
});
test('active video decision uses title and text fallback; distinct evidenced video label remains a transition',()=>{
 const f=page([]),title=f.document.querySelector('.prev_title');f.document.body.insertAdjacentHTML('beforeend','<button class="prev_white">视频</button>');const tab=f.document.querySelector('.prev_white');
 title.removeAttribute('title');title.textContent='视频';assert.equal(currentStepTitle(f.document),'视频');assert.equal(isActiveVideoTab(f.document,tab),true);
 title.title='视频';title.textContent='unrelated fallback';assert.equal(isActiveVideoTab(f.document,tab),true);
 title.title='1视频';tab.textContent='2视频';f.document.body.insertAdjacentHTML('beforeend','<button class="prev_white">1视频</button>');assert.equal(isActiveVideoTab(f.document,tab),false);
 f.dom.window.close();
});
