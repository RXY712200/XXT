import test from 'node:test';
import assert from 'node:assert/strict';
import { page,clock,microtasks } from './support.js';
import { mountPanel } from '../src/ui/panel.js';
import { defaults } from '../src/runtime/preferences.js';
import { bootstrap } from '../src/runtime/browser.js';

test('two independent hosts share one live state without announcements on unchanged renders; cleanup removes handlers',()=>{
 const f=page([]);let message='正在检测当前小节',stops=0,starts=0,clears=0;
 const app={view:()=>({settings:defaults,message,total:0,restRemaining:0}),start:()=>starts++,stop:()=>stops++,resume(){},rescan(){},restore(){},update(){},exportDiagnostics:()=>'{"events":[]}',clearDiagnostics:()=>clears++};
 const ui=mountPanel(f.document,app),root=ui.host.shadowRoot,q=ui.notice.shadowRoot;
 assert.equal(f.document.querySelectorAll('aside').length,2);assert.equal(root.querySelector('summary').textContent,'学习设置');assert.equal(root.querySelector('details').open,false);
 const status=q.querySelector('[role=status]'),textNode=status.firstChild;ui.render();assert.equal(status.firstChild,textNode);
 message='目录上下文已失效，请重新检测';ui.render();assert.equal(status.textContent,message);root.querySelector('details').open=true;ui.render();assert.equal(root.querySelector('details').open,true);assert.ok(ui.notice.isConnected);
 q.querySelectorAll('button')[0].click();q.querySelectorAll('button')[1].click();assert.equal(stops,1);assert.equal(starts,1);
 const reportButtons=root.querySelectorAll('#reports button');reportButtons[0].click();reportButtons[1].click();assert.equal(root.querySelector('textarea').value,'{"events":[]}');reportButtons[2].click();assert.equal(clears,1);
 const stop=q.querySelector('button');ui.destroy();stop.click();assert.equal(stops,1);assert.equal(f.document.querySelector('#xxt-control'),null);assert.equal(f.document.querySelector('#xxt-notice'),null);f.dom.window.close();
});

test('quick notice Stop cancels pending next playback and settings expansion cannot restart it',async()=>{
 const f=page(['video','video']),time=clock(),calls=[0,0];
 for(const [i,m] of f.players.entries()){let paused=true,ended=false;Object.defineProperties(m,{readyState:{value:4},paused:{get:()=>paused},ended:{get:()=>ended}});m.play=()=>{calls[i]++;paused=false;return Promise.resolve();};m.pause=()=>{paused=true;};m.finish=()=>{ended=true;m.dispatchEvent(new f.dom.window.Event('ended'));};}
 let value=JSON.stringify({version:1,settings:{...defaults,minMs:5000,maxMs:5000},stopped:false,restUntil:0,count:0,seen:[]});
 const app=bootstrap(f.document,{clock:time,storage:{getItem:()=>value,setItem(k,v){value=v;}}});time.advance(0);await microtasks();
 const details=f.document.querySelector('#xxt-control').shadowRoot.querySelector('details');details.open=true;details.open=false;assert.deepEqual(calls,[1,0]);
 f.players[0].finish();time.advance(0);await microtasks();f.document.querySelector('#xxt-notice').shadowRoot.querySelector('button').click();
 time.advance(6000);await microtasks();assert.deepEqual(calls,[1,0]);assert.equal(JSON.parse(value).stopped,true);assert.equal(app.view().platformConfirmed,false);
 assert.match(f.document.querySelector('#xxt-notice').shadowRoot.querySelector('[role=status]').textContent,/停止/);app.dispose();f.dom.window.close();
});
