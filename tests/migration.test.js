import test from 'node:test';
import assert from 'node:assert/strict';
import { page,clock,microtasks } from './support.js';
import { createInventoryReader,inspectInventory } from '../src/platform/inventory.js';
import { evaluateCompletion } from '../src/core/completion.js';
import { catalogStatus } from '../src/platform/fork-credit.js';
import { createPreferences,defaults } from '../src/runtime/preferences.js';
import { bootstrap } from '../src/runtime/browser.js';
import { JSDOM } from 'jsdom';
import { createArtifact } from '../scripts/build-userscript.mjs';

// Adapted historical regression intent: source tests/navigation-v3.mjs prior-credit,
// detached catalog rebinding and removed attachment recheck; not old global APIs.
test('migrated prior-credit status requires own positive marker, not zero count or message text',()=>{
 const f=page(),node=f.document.querySelector('.posCatalog_active');node.querySelector('input').value='0';node.append('任务点已完成');
 assert.equal(catalogStatus(node),'unknown');f.markLesson();assert.equal(catalogStatus(node),'completed');
 node.querySelector('input').value='1';assert.equal(catalogStatus(node),'incomplete');assert.equal(evaluateCompletion(createInventoryReader().scan(f.document)).lessonConfirmed,false);f.dom.window.close();
});
test('positively credited detached catalog rerender preserves exact media scope but rejects changed topology',()=>{
 const f=page();f.markLesson();const reader=createInventoryReader(),old=reader.scan(f.document),tree=f.document.querySelector('#coursetree');tree.replaceWith(tree.cloneNode(true));
 assert.equal(inspectInventory(old).valid,true);assert.equal(evaluateCompletion(old).lessonConfirmed,true);
 f.document.querySelector('#unit-0-1 .posCatalog_name').title='Changed task';assert.equal(inspectInventory(old).valid,false);f.dom.window.close();
});
test('credited known attachment removal rebinds independently; unknown removal does not silently advance',async()=>{
 for(const kind of ['video','unknown']){const f=page([kind]),time=clock();let value=JSON.stringify({version:1,settings:{...defaults,navigation:false},stopped:false,restUntil:0,count:0,seen:[]});
 f.markLesson();const app=bootstrap(f.document,{clock:time,ui:false,storage:{getItem:()=>value,setItem(k,v){value=v;}}});f.owners[0].parentElement.remove();time.advance(500);await microtasks();
 assert.equal(app.view().platformConfirmed,kind==='video');assert.equal(JSON.parse(value).stopped,kind==='unknown');app.dispose();f.dom.window.close();}
});
test('new defaults enable eligible navigation but explicit saved false remains false',()=>{
 const fresh=createPreferences({getItem:()=>null,setItem(){}});assert.equal(fresh.snapshot().settings.navigation,true);
 const saved=createPreferences({getItem:()=>JSON.stringify({version:1,settings:{...defaults,navigation:false},stopped:true,count:0,restUntil:0,seen:[]}),setItem(){}});
 assert.equal(saved.snapshot().settings.navigation,false);assert.equal(saved.snapshot().stopped,true);
});
test('generated runtime starts on a credited lesson without replay and acknowledges native next content once',async()=>{
 const fixture=page([]);fixture.markLesson();fixture.document.querySelector('.posCatalog_active input').setAttribute('value','0');const dom=new JSDOM(fixture.document.documentElement.outerHTML,{url:fixture.document.URL,runScripts:'outside-only'});fixture.dom.window.close();
 const time=clock();dom.window.setTimeout=(fn,ms)=>time.setTimeout(fn,ms);dom.window.clearTimeout=id=>time.clearTimeout(id);
 dom.window.localStorage.setItem('xxt.state.v1',JSON.stringify({version:1,settings:{...defaults,delays:false},stopped:false,restUntil:0,count:0,seen:[]}));
 const d=dom.window.document;let clicks=0;const target=d.querySelector('#unit-0-1');target.onclick=()=>{clicks++;d.querySelector('.posCatalog_active').classList.remove('posCatalog_active');target.classList.add('posCatalog_active');
 const root=d.querySelector('iframe[info=card]').contentDocument;root.body.innerHTML='<iframe id="next" class="ans-attach-online ans-insertvideo-online"></iframe>';root.querySelector('iframe').contentDocument.body.innerHTML='<video id="video_html5_api" src="https://invalid.example/next"></video>';};
 dom.window.eval(createArtifact());assert.equal(dom.window.XXT.view().platformConfirmed,true);time.advance(500);await microtasks();
 assert.equal(clicks,1);assert.equal(d.querySelector('.posCatalog_active'),target);assert.equal(dom.window.XXT.view().platformConfirmed,false);dom.window.XXT.dispose();dom.window.close();
});
