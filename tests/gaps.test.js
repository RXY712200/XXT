import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { page,clock,microtasks } from './support.js';
import { bootstrap } from '../src/runtime/browser.js';
import { objectiveVideoTab } from '../src/runtime/native-tabs.js';
import { createInventoryReader } from '../src/platform/inventory.js';
import { createCoordinator } from '../src/core/coordinator.js';
import { defaults } from '../src/runtime/preferences.js';

test('objective native handler runs once and generated content is recognized without completion',async()=>{
 const f=page([]),time=clock();f.document.querySelector('.prev_title').title='学习目标';
 f.document.body.insertAdjacentHTML('beforeend','<div class="prev_white">2 视频</div>');let clicks=0,plays=0;
 f.document.querySelector('.prev_white').addEventListener('click',()=>{clicks++;f.document.querySelector('.prev_title').title='视频';
  f.root.body.innerHTML='<iframe id="native-video" class="ans-attach-online ans-insertvideo-online"></iframe>';
  const doc=f.root.querySelector('iframe').contentDocument,m=doc.createElement('video');m.id='video_html5_api';m.src='https://invalid.example/tab';let paused=true;
  Object.defineProperties(m,{readyState:{value:4},paused:{get:()=>paused}});m.play=()=>{plays++;paused=false;return Promise.resolve();};m.pause=()=>{paused=true;};doc.body.append(m);
 });
 const storage={getItem:()=>JSON.stringify({version:1,settings:{...defaults,delays:false},stopped:false,restUntil:0,count:0,seen:[]}),setItem(){}};
 const app=bootstrap(f.document,{clock:time,storage,ui:false});assert.equal(clicks,1);time.advance(500);await microtasks();
 assert.equal(plays,1);assert.equal(app.view().platformConfirmed,false);assert.equal(bootstrap(f.document),app);assert.equal(clicks,1);app.dispose();f.dom.window.close();
});

test('ambiguous/numeric/hidden tabs do not become automatic targets and Stop cancels tab waiting',()=>{
 const f=page([]);f.document.querySelector('.prev_title').title='学习目标';f.document.body.insertAdjacentHTML('beforeend','<div class="prev_white">2</div>');
 assert.equal(objectiveVideoTab(f.document),null);f.document.querySelector('.prev_white').textContent='视频';
 f.document.body.insertAdjacentHTML('beforeend','<div class="prev_white">视频</div>');assert.equal(objectiveVideoTab(f.document),null);
 f.document.querySelector('.prev_white').hidden=true;assert.ok(objectiveVideoTab(f.document));
 let clicks=0;objectiveVideoTab(f.document).addEventListener('click',()=>clicks++);const time=clock(),app=bootstrap(f.document,{clock:time,ui:false});
 assert.equal(clicks,1);app.stop();time.advance(20000);assert.equal(clicks,1);assert.equal(app.view().platformConfirmed,false);app.dispose();f.dom.window.close();
});

test('special owned structures have specific non-executable inventory diagnostics; unknown near-matches remain unknown',()=>{
 const examples=[['hyperlink','<a id="hyperlink">native link</a>',{},'https://example.invalid/'],
 ['audio-slides','<div class="swiper-container"><div class="swiper-slide"></div></div><audio></audio>',{},'https://example.invalid/'],
 ['legacy-multimedia','legacy placeholder',{module:'insertflash'},'https://example.invalid/'],
 ['book-knowledge-map','<div id="ReadWeb"></div>',{module:'insertbook'},'https://mooc1.chaoxing.com/readsvr/book/mooc/'],
 ['timed-reader','<div id="reader"><div class="readerPager"></div></div><input id="pagejump">',{},'https://mooc1.chaoxing.com/readsvr/book/mooc/?timing=30']];
 for(const [kind,html,metadata,url] of examples){const f=page(['unknown']),inner=new JSDOM(html,{url});Object.defineProperty(f.owners[0],'contentDocument',{value:inner.window.document});f.owners[0].setAttribute('data',JSON.stringify({...metadata,objectid:'synthetic-item'}));
  const inventory=createInventoryReader().scan(f.document);assert.equal(inventory.tasks[0].recognition.kind,kind);const c=createCoordinator();c.bind(inventory);c.startNext();
  assert.equal(c.snapshot().diagnostic,`recognition-only-${kind}`);f.markLesson();assert.equal(c.navigationDecision('prior-credit').allowed,false);c.destroy();inner.window.close();f.dom.window.close();}
 const f=page(['unknown']);f.owners[0].contentDocument.body.innerHTML='<div id="ReadWeb"></div>';assert.equal(createInventoryReader().scan(f.document).tasks[0].recognition,null);f.dom.window.close();
});

test('invalid inventory never displays positive whole-lesson platform credit',()=>{
 const f=page();f.markLesson();const time=clock(),app=bootstrap(f.document,{clock:time,ui:false});assert.equal(app.view().platformConfirmed,true);
 f.owners[0].remove();assert.equal(app.view().platformConfirmed,false);app.dispose();f.dom.window.close();
});
