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
      createDocumentAdapter({random:()=>0.5}).start(context).then(handle=>handle.activate(),reject);
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
  const reinjected=await send('Runtime.evaluate',{expression:userscript+'\nwindow.__testXXT===window.XXT && document.querySelectorAll("#xxt-control").length===1;',returnByValue:true},sessionId);
  assert.equal(reinjected.result.value,true);
  await pageReady(()=>send('Page.reload',{},sessionId));
  const reloaded=await send('Runtime.evaluate',{expression:userscript+'\n({paused:window.XXT.view().message,panels:document.querySelectorAll("#xxt-control").length});',returnByValue:true},sessionId);
  assert.equal(reloaded.exceptionDetails,undefined);assert.equal(reloaded.result.value.panels,1);assert.match(reloaded.result.value.paused,/停止/);
  console.log('PASS native Chrome generated artifact/UI duplicate-injection and persisted Stop/reload; synthetic intercepted page, no authenticated platform evidence.');
  await send('Browser.close');
} finally {
  socket?.close(); child.kill(); await new Promise(resolve => server.close(resolve));
}
