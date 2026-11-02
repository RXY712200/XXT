// Optional real Chrome smoke check. No autoplay/security flags or authenticated pages.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..');
const profile = resolve(root, '.local', `chrome-media-${Date.now()}`);
await mkdir(profile, { recursive: true });
const chrome = process.env.XXT_CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const server = createServer(async (req, res) => {
  if (req.url === '/') { res.end('<!doctype html><title>XXT inert native media smoke</title>'); return; }
  const target = resolve(root, '.' + req.url);
  if (!target.startsWith(resolve(root, 'src') + '\\') && !target.startsWith(resolve(root, 'src') + '/')) { res.writeHead(404); res.end(); return; }
  try { res.setHeader('content-type', 'text/javascript'); res.end(await readFile(target)); } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const child = spawn(chrome, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: ['ignore','ignore','pipe'] });
let socket;
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Chrome debugger startup timeout')), 10000);
    child.once('error', reject); let text = '';
    child.stderr.on('data', bytes => { text += bytes; const match = text.match(/DevTools listening on (ws:\/\/[^\s]+)/); if (match) { clearTimeout(timer); resolve(match[1]); } });
  });
  socket = new WebSocket(endpoint); await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0, loaded; const requests = new Map();
  socket.onmessage = event => {
    const response = JSON.parse(event.data);
    if (response.method === 'Fetch.requestPaused') {
      send('Fetch.fulfillRequest', { requestId: response.params.requestId, responseCode: 200,
        responseHeaders: [{name:'Content-Type',value:'text/html'}], body: Buffer.from('<!doctype html><title>XXT synthetic intercepted course</title><body></body>').toString('base64') }, response.sessionId).catch(error => { throw error; });
    }
    if (response.method === 'Page.loadEventFired') loaded?.();
    const request = requests.get(response.id); if (request) { requests.delete(response.id); response.error ? request.reject(Error(response.error.message)) : request.resolve(response.result); }
  };
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => { const key = ++id; requests.set(key, { resolve, reject }); socket.send(JSON.stringify({ id: key, method, params, ...(sessionId ? { sessionId } : {}) })); });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  const ready = new Promise((resolve, reject) => { const timer = setTimeout(() => reject(Error('local page readiness timeout')), 10000); loaded = () => { clearTimeout(timer); resolve(); }; });
  await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` }, sessionId); await ready;
  // No user gesture is supplied. Native browser policy determines fallback outcome.
  const expression = `(async () => {
    const { startMedia } = await import('/src/adapters/media.js');
    const { createScheduler } = await import('/src/core/scheduler.js');
    async function run(kind) {
    const scheduler = createScheduler(), abort = new AbortController();
    const audio = document.createElement(kind); audio.id = 'synthetic-native-media'; document.body.append(audio);
    const samples = 8000, data = new ArrayBuffer(44 + samples * 2), view = new DataView(data);
    function word(at,s) { for(let i=0;i<s.length;i++)view.setUint8(at+i,s.charCodeAt(i)); }
    word(0,'RIFF'); view.setUint32(4,36+samples*2,true); word(8,'WAVE'); word(12,'fmt ');view.setUint32(16,16,true);
    view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,8000,true);view.setUint32(28,16000,true);view.setUint16(32,2,true);view.setUint16(34,16,true);word(36,'data');view.setUint32(40,samples*2,true);
    for(let i=0;i<samples;i++)view.setInt16(44+i*2,Math.sin(i*2*Math.PI*220/8000)*1000,true);
    audio.preload='none';
    const declaredURL=URL.createObjectURL(new Blob([data],{type:'audio/wav'}));
    const source=document.createElement('source');source.src=declaredURL;source.type='audio/wav';audio.append(source);
    const initialReadyState=audio.readyState;
    let completions=0, failures=[], initialTime=audio.currentTime;
    const ended = new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>reject(Error('native end timeout')),8000);
      const context={task:{player:audio,owner:audio,path:[]},signal:abort.signal,now:()=>Date.now(),isCurrent:()=>!abort.signal.aborted,
        schedule: action=>scheduler.request({...action,validate:()=>!abort.signal.aborted}),
        scheduleRecurring: action=>scheduler.recurring({...action,validate:()=>!abort.signal.aborted}),cancelScheduled:key=>scheduler.cancel(key),
        done(){completions++;clearTimeout(timeout);resolve();},fail(reason){failures.push(reason);clearTimeout(timeout);reject(Error(reason));}};
      startMedia(context,kind).then(handle=>handle.activate(),error=>{clearTimeout(timeout);reject(error);});
    });
    let outcome='ended';try{await ended;}catch(error){if(error.message!=='autoplay-denied-after-fallback')throw error;outcome=error.message;}
    const result={kind,initialReadyState,selectedDeclaredSource:audio.currentSrc===declaredURL,outcome,ended:audio.ended,completions,failures,rate:audio.playbackRate,progressed:audio.currentTime>initialTime,muted:audio.muted,pending:scheduler.snapshot().filter(a=>a.status==='pending').length};
    abort.abort();scheduler.cancelAll();URL.revokeObjectURL(declaredURL);return result;
    }
    const mediaResults=[await run('audio'),await run('video')];
    const {createDocumentAdapter}=await import('/src/adapters/document.js');
    const frame=document.createElement('iframe');document.body.append(frame);
    const d=frame.contentDocument;d.body.innerHTML='<div style="height:80px;overflow-y:auto"><div style="height:180px">Generated native HTML reader</div></div>';
    const viewer=d.body.firstChild,scheduler=createScheduler(),abort=new AbortController();let readingDone=0;
    await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('native reader timeout')),15000);
      const context={task:{owner:frame,kind:'document',identity:'verified'},signal:abort.signal,isCurrent:()=>!abort.signal.aborted,now:()=>Date.now(),
        schedule:action=>scheduler.request({...action,validate:()=>!abort.signal.aborted}),scheduleRecurring:action=>scheduler.recurring({...action,validate:()=>!abort.signal.aborted}),
        cancelScheduled:key=>scheduler.cancel(key),done(){readingDone++;clearTimeout(timeout);resolve();},fail(reason){clearTimeout(timeout);reject(Error(reason));}};
      // Fixed broad sampling steps keep this geometry-only check independent of
      // subpixel rounding near the existing reader's one-pixel bottom tolerance.
      createDocumentAdapter({random:()=>0,interval:()=>1000}).start(context).then(handle=>handle.activate(),reject);
    });
    const readerResult={localDone:readingDone,top:viewer.scrollTop,range:viewer.scrollHeight-viewer.clientHeight};
    abort.abort();scheduler.cancelAll();frame.remove();return {mediaResults,readerResult};
  })()`;
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, timeout: 15000 }, sessionId);
  assert.equal(result.exceptionDetails, undefined, JSON.stringify(result.exceptionDetails));
  const {mediaResults:values,readerResult} = result.result.value;
  assert.equal(readerResult.localDone,1);assert.equal(readerResult.top,readerResult.range);
  for (const value of values) {
    assert.equal(value.initialReadyState, 0);
    assert.equal(value.rate, 1); assert.equal(value.pending, 0); assert.deepEqual(value.failures, []);
    if (value.outcome === 'ended') { assert.equal(value.selectedDeclaredSource, true); assert.equal(value.ended, true); assert.equal(value.completions, 1); assert.equal(value.progressed, true); }
    else { assert.equal(value.outcome, 'autoplay-denied-after-fallback'); assert.equal(value.completions, 0); assert.equal(value.ended, false); }
  }
  console.log('PASS native Chrome policy/end safety smoke:', JSON.stringify(values));
  console.log('PASS native Chrome HTML reader geometry/local-bottom smoke:',JSON.stringify(readerResult));
  console.log('Fixture is a generated WAV audio track in audio/video elements, not real course video.');
  console.log('Not authenticated Chaoxing, not a background OS/tab-switch test; synthetic ownership context, real media API/events.');
  // Intercept the entire synthetic page before network access; no authenticated
  // page, credentials, permission overrides or real platform response is used.
  await send('Fetch.enable',{patterns:[{urlPattern:'https://mooc1.chaoxing.com/*',requestStage:'Request'}]},sessionId);
  async function pageReady(action) {
    const ready=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('synthetic product page timeout')),10000);loaded=()=>{clearTimeout(timer);resolve();};});
    await action();await ready;
  }
  await pageReady(()=>send('Page.navigate',{url:'https://mooc1.chaoxing.com/mycourse/studentstudy?courseid=synthetic-test'},sessionId));
  await send('Runtime.evaluate',{expression:`localStorage.setItem('xxt.state.v1',JSON.stringify({version:1,settings:{},stopped:true,restUntil:0,count:0,seen:[]}));`},sessionId);
  const userscript=await readFile(resolve(root,'dist/XXT.user.js'),'utf8');
  const installed=await send('Runtime.evaluate',{expression:userscript+'\nwindow.__testXXT=window.XXT;({paused:window.XXT.view().message,panels:document.querySelectorAll("#xxt-control").length});',returnByValue:true},sessionId);
  assert.equal(installed.exceptionDetails,undefined);assert.equal(installed.result.value.panels,1);assert.match(installed.result.value.paused,/停止/);
  const reinjected=await send('Runtime.evaluate',{expression:userscript+'\nwindow.__testXXT===window.XXT && document.querySelectorAll("#xxt-control").length===1 && document.querySelectorAll("#xxt-notice").length===1;',returnByValue:true},sessionId);
  assert.equal(reinjected.result.value,true);
  await pageReady(()=>send('Page.reload',{},sessionId));
  const reloaded=await send('Runtime.evaluate',{expression:userscript+'\n({paused:window.XXT.view().message,panels:document.querySelectorAll("#xxt-control").length});',returnByValue:true},sessionId);
  assert.equal(reloaded.exceptionDetails,undefined);assert.equal(reloaded.result.value.panels,1);assert.match(reloaded.result.value.paused,/停止/);
  console.log('PASS native Chrome generated artifact/UI duplicate-injection and persisted Stop/reload; synthetic intercepted page, no authenticated platform evidence.');
  for(const [width,height] of [[1280,900],[320,480]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false},sessionId);
    const layout=await send('Runtime.evaluate',{expression:`(()=>{const top=document.querySelector('#xxt-control'),bottom=document.querySelector('#xxt-notice'),r=top.shadowRoot,q=bottom.shadowRoot;const details=r.querySelector('details');details.open=true;q.querySelector('[role=status]').textContent='需要人工处理的长中文状态说明'.repeat(30);const a=top.getBoundingClientRect(),b=bottom.getBoundingClientRect(),section=r.querySelector('section');return {top:getComputedStyle(top).top,right:getComputedStyle(top).right,bottom:getComputedStyle(bottom).bottom,hostPointer:getComputedStyle(top).pointerEvents,detailPointer:getComputedStyle(details).pointerEvents,scroll:getComputedStyle(section).overflowY,inside:a.left>=0&&b.left>=0&&a.right<=innerWidth&&b.right<=innerWidth,separate:a.bottom<=b.top,sectionHeight:section.clientHeight,noticeHeight:b.height,settingsHit:document.elementFromPoint(a.left+20,a.top+10)===top,noticeHit:document.elementFromPoint(b.left+15,b.bottom-15)===bottom};})()`,returnByValue:true},sessionId);
    assert.equal(layout.exceptionDetails,undefined);const v=layout.result.value;assert.equal(v.top,'8px');assert.equal(v.right,'8px');assert.equal(v.bottom,'86px');assert.equal(v.hostPointer,'none');assert.equal(v.detailPointer,'auto');assert.equal(v.scroll,'auto');assert.equal(v.inside,true);assert.equal(v.separate,true);assert.equal(v.settingsHit,true);assert.equal(v.noticeHit,true);
    console.log('PASS native two-area layout:',width,height,JSON.stringify(v));
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false},sessionId);
  const prepareTabs = `(stopAfterClick=false)=>{
    window.XXT.dispose();document.body.innerHTML='<div class="prev_title" title="1视频"></div><div id="coursetree"><div id="unit" class="posCatalog_select posCatalog_active"><span class="posCatalog_name">Synthetic</span><input class="jobUnfinishCount" value="1"></div></div><button class="prev_white">2视频</button><iframe info="card"></iframe>';
    window.__tabs={old:0,next:0,pauses:0,trusted:0};
    function content(which){const root=document.querySelector('iframe').contentDocument;root.body.innerHTML='<iframe id="owned-'+which+'" class="ans-attach-online ans-insertvideo-online"></iframe>';const doc=root.querySelector('iframe').contentDocument,m=doc.createElement('video');let paused=true;m.id='video_html5_api';m.src='https://invalid.example/'+which;Object.defineProperties(m,{readyState:{get:()=>4},paused:{get:()=>paused}});m.play=()=>{window.__tabs[which]++;paused=false;return Promise.resolve();};m.pause=()=>{paused=true;window.__tabs.pauses++;};doc.body.append(m);}
    content('old');localStorage.setItem('xxt.state.v1',JSON.stringify({version:1,settings:{delays:false},stopped:false,restUntil:0,count:0,seen:[]}));
    document.querySelector('button').onclick=e=>{if(e.isTrusted)window.__tabs.trusted++;const title=document.querySelector('.prev_title');if((title.getAttribute('title')||title.textContent)==='2视频')return;title.title='2视频';setTimeout(()=>content('next'),100);if(stopAfterClick)window.XXT.stop();};
  }`;
  async function evaluate(expression){const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},sessionId);assert.equal(result.exceptionDetails,undefined,JSON.stringify(result.exceptionDetails));return result.result.value;}
  async function nativeTabClick(){const rect=await evaluate('(()=>{const r=document.querySelector("button.prev_white").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()');
    await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...rect},sessionId);await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...rect},sessionId);}
  await evaluate(`(${prepareTabs})()`);await evaluate(userscript);await evaluate('new Promise(r=>setTimeout(r,100))');
  await nativeTabClick();await evaluate('new Promise(r=>setTimeout(r,1100))');
  let tabResult=await evaluate('({...window.__tabs,state:window.XXT.view().taskState})');assert.equal(tabResult.trusted,1);assert.equal(tabResult.old,1);assert.equal(tabResult.next,1);assert.equal(tabResult.state,'RUNNING');
  const pauses=tabResult.pauses;await nativeTabClick();
  await evaluate('document.querySelector(".prev_title").removeAttribute("title");document.querySelector(".prev_title").textContent="2视频"');await nativeTabClick();
  tabResult=await evaluate('({...window.__tabs,state:window.XXT.view().taskState})');assert.equal(tabResult.pauses,pauses);assert.equal(tabResult.next,1);assert.equal(tabResult.state,'RUNNING');
  await evaluate(`(${prepareTabs})()`);await evaluate('document.querySelector(".prev_title").title="视频";document.querySelector("button").onclick=e=>{if(e.isTrusted)window.__tabs.trusted++;};');
  await evaluate(userscript);await evaluate('new Promise(r=>setTimeout(r,100))');await nativeTabClick();await evaluate('new Promise(r=>setTimeout(r,600))');
  tabResult=await evaluate('({...window.__tabs,state:window.XXT.view().taskState})');assert.equal(tabResult.trusted,1);assert.equal(tabResult.pauses,0);assert.equal(tabResult.old,1);assert.equal(tabResult.state,'RUNNING');
  await evaluate(`(${prepareTabs})(true)`);await evaluate(userscript);await evaluate('new Promise(r=>setTimeout(r,100))');await nativeTabClick();await evaluate('new Promise(r=>setTimeout(r,1100))');
  assert.equal((await evaluate('window.__tabs')).next,0);
  console.log('PASS native Chromium trusted mouse tab transition, active title/text re-click and Stop cancellation; media playback mocked on synthetic page, no authenticated evidence.');
  // New independent fixture: actual browser iframe reconstruction and durable
  // storage/UI integration. Media play/ended are controlled, not policy evidence.
  await evaluate(`(${prepareTabs})()`);
  await evaluate(`sessionStorage.removeItem('xxt.unattended-recovery.v1');localStorage.removeItem('xxt.partial-session.v1');`);
  await evaluate(userscript);await evaluate('new Promise(r=>setTimeout(r,100))');
  await evaluate(`(()=>{const card=document.querySelector('iframe[info=card]');window.__rebuild={html:card.contentDocument.body.innerHTML,body:card.contentDocument.querySelector('iframe').contentDocument.body.innerHTML,old:card.contentDocument.querySelector('iframe').contentDocument.querySelector('video')};card.remove();})()`);
  async function until(expression) {
    const deadline=Date.now()+4000;
    while(Date.now()<deadline){if(await evaluate(expression))return;await new Promise(resolve=>setTimeout(resolve,50));}
    assert.fail('Native state acknowledgement timed out: '+expression);
  }
  await until(`/框架重建/.test(window.XXT.view().message)`);
  await evaluate(`(()=>{const card=document.createElement('iframe');card.setAttribute('info','card');document.body.append(card);card.contentDocument.body.innerHTML=window.__rebuild.html;const inner=card.contentDocument.querySelector('iframe');inner.contentDocument.body.innerHTML=window.__rebuild.body;const m=inner.contentDocument.querySelector('video');let paused=true;Object.defineProperties(m,{paused:{get:()=>paused},readyState:{get:()=>4}});m.play=()=>{window.__tabs.rebuilt=(window.__tabs.rebuilt||0)+1;paused=false;return Promise.resolve();};m.pause=()=>{paused=true;};window.__rebuild.current=m;})()`);
  await until(`window.__tabs.rebuilt===1&&window.XXT.view().taskState==='RUNNING'`);
  await evaluate(`window.__rebuild.old.dispatchEvent(new Event('ended'));Object.defineProperty(window.__rebuild.current,'ended',{value:true});window.__rebuild.current.dispatchEvent(new Event('ended'));`);
  assert.equal((await evaluate('window.__tabs')).old,1);
  await until(`window.XXT.view().taskState==='WAITING_PLATFORM'`);
  await evaluate('window.XXT.dispose()');await evaluate(userscript);
  const restored=await evaluate(`({state:window.XXT.view().taskState,local:window.XXT.view().localDone,credit:window.XXT.view().platformConfirmed,plays:window.__tabs.rebuilt,text:document.querySelector('#xxt-control').shadowRoot.querySelector('#status').textContent})`);
  assert.equal(restored.state,'RESTORED_WAITING_PLATFORM');assert.equal(restored.local,true);assert.equal(restored.credit,false);assert.equal(restored.plays,1);assert.match(restored.text,/已恢复本地结束记录/);
  console.log('PASS native Chromium missing-frame recovery and persisted local-wait UI; real DOM/storage, mocked media, no authenticated evidence.');
  const handoffHTML=await readFile(resolve(root,'fixtures/synthetic/completed-assessment-handoff.html'),'utf8');
  const prepareHandoff=`()=>{
    window.XXT?.dispose();document.body.innerHTML=${JSON.stringify(handoffHTML)};
    for(const key of ['xxt.partial-session.v1','xxt.decisions.v1'])localStorage.removeItem(key);sessionStorage.removeItem('xxt.unattended-recovery.v1');
    localStorage.setItem('xxt.state.v1',JSON.stringify({version:1,settings:{delays:true,minMs:2000,maxMs:2000},stopped:false,count:0,seen:[],restUntil:0}));
    window.__handoff={clicks:0,plays:0};
    window.__handoffContent=name=>{const d=document.querySelector('iframe[info=card]').contentDocument;d.body.innerHTML='<section class="ans-attach-ct"><span class="ans-job-icon ans-job-finished"></span><iframe class="ans-attach-online ans-insertvideo-online" id="owned-'+name+'"></iframe></section>';const inner=d.querySelector('iframe').contentDocument,m=inner.createElement('video');m.id='video_html5_api';m.preload='none';m.src='https://invalid.example/'+name;m.play=()=>{window.__handoff.plays++;return Promise.resolve();};m.pause=()=>{};inner.body.append(m);};
    window.__handoffContent('source');document.getElementById('learning').onclick=()=>{window.__handoff.clicks++;document.querySelector('.posCatalog_active').classList.remove('posCatalog_active');document.getElementById('learning').classList.add('posCatalog_active');setTimeout(()=>window.__handoffContent('learning'),700);};
    const native=document.createElement('button');native.id='synthetic-native-control';native.textContent='原生导航';native.style='position:fixed;right:8px;bottom:8px;width:120px;height:28px';document.body.append(native);
  }`;
  await evaluate(`(${prepareHandoff})()`);await evaluate(userscript);await until(`window.XXT.view().deadlineKind==='navigation'`);
  const before=await evaluate('window.XXT.view().remainingMs');await evaluate('new Promise(r=>setTimeout(r,300))');const after=await evaluate('window.XXT.view().remainingMs');assert.ok(after<before&&after>0);
  for(const [width,height] of [[1280,900],[320,480]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false},sessionId);
    const layout=await evaluate(`(()=>{const top=document.querySelector('#xxt-control'),bottom=document.querySelector('#xxt-notice'),r=top.shadowRoot,q=bottom.shadowRoot;r.querySelector('details').open=true;const a=top.getBoundingClientRect(),b=bottom.getBoundingClientRect(),control=document.getElementById('synthetic-native-control'),c=control.getBoundingClientRect();return {inside:b.left>=0&&b.top>=0&&b.right<=innerWidth&&b.bottom<=innerHeight,separate:a.bottom<=b.top,fields:[...q.querySelectorAll('dl>div')].filter(n=>!n.hidden).every(n=>{const x=n.getBoundingClientRect();return x.top>=b.top&&x.bottom<=b.bottom;}),nativeHit:document.elementFromPoint(c.left+c.width/2,c.top+c.height/2)===control,quickHit:document.elementFromPoint(b.left+20,b.bottom-15)===bottom,closedByDefault:!r.querySelector('#features').open};})()`);
    if(!layout.inside)console.log('Runtime bounds:',await evaluate(`({rect:document.querySelector('#xxt-notice').getBoundingClientRect().toJSON(),innerWidth,innerHeight,box:getComputedStyle(document.querySelector('#xxt-notice').shadowRoot.querySelector('#runtime')).width})`));
    for(const [field,value] of Object.entries(layout))assert.equal(value,true,`${width}x${height} ${field}: ${JSON.stringify(layout)}`);
    console.log('PASS full runtime responsive/hit-test:',width,height,JSON.stringify(layout));
  }
  await until(`JSON.parse(window.XXT.exportDiagnostics()).events.some(e=>e.stage==='acknowledged')`);
  const handoff=await evaluate(`({clicks:window.__handoff.clicks,plays:window.__handoff.plays,current:document.querySelector('.posCatalog_active').id,unfinished:document.querySelector('#assessment input').value,credit:window.XXT.view().platformConfirmed})`);
  assert.deepEqual(handoff,{clicks:1,plays:0,current:'learning',unfinished:'1',credit:false});
  await evaluate(`(${prepareHandoff})()`);await evaluate(userscript);await until(`window.XXT.view().deadlineKind==='navigation'`);
  const stopPoint=await evaluate(`(()=>{const b=document.querySelector('#xxt-notice').shadowRoot.querySelector('button').getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+b.height/2};})()`);
  await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...stopPoint},sessionId);await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...stopPoint},sessionId);
  await until(`window.XXT.view().runtimePhase==='stopped'`);await evaluate('new Promise(r=>setTimeout(r,2200))');
  assert.equal(await evaluate('window.__handoff.clicks'),0);assert.equal(await evaluate('window.XXT.view().remainingMs'),null);
  console.log('PASS native Chromium optional-assessment handoff, real deadline countdown and trusted quick Stop; synthetic DOM/mocked media only.');
  await send('Browser.close');
} finally {
  socket?.close(); child.kill(); await new Promise(resolve => server.close(resolve));
}
