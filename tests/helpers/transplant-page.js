import {JSDOM} from 'jsdom';
import jquery from 'jquery';
import {readFileSync} from 'node:fs';
// Synthetic browser surface only. Never patch production functions or source text.
export async function coursePage({kind='video',delayed=false,credited=false,storage={}}={}) {
  const dom=new JSDOM('<div class="prev_title" title="视频">视频</div><div id="coursetree"><ul><li id="chapter-synthetic"><ul><li><div id="lesson-a" class="posCatalog_select posCatalog_active"><span class="posCatalog_name" title="学习内容 A">学习内容 A</span><input class="jobUnfinishCount" value="1"></div></li><li><div id="lesson-b" class="posCatalog_select"><span class="posCatalog_name" title="学习内容 B">学习内容 B</span><input class="jobUnfinishCount" value="1"></div></li></ul></li></ul></div><iframe info="card"></iframe>',
    {url:'https://mooc1.chaoxing.com/mycourse/studentstudy?courseid=synthetic-course&clazzid=synthetic-class',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,doc=w.document;
  w.$=w.jQuery=jquery(w);w.unsafeWindow=w;w.CSS={escape:value=>String(value).replace(/[^a-z0-9_-]/gi,'\\$&')};
  for(const [k,v] of Object.entries(storage))w.sessionStorage.setItem(k,v);
  Object.defineProperty(w.HTMLElement.prototype,'getClientRects',{value:function(){return this.hidden?[]:[{width:500,height:300}];}});
  const timers=new Map(),errors=[],events=[];let sequence=0,now=100000;
  w.Date.now=()=>now;
  const add=(fn,ms,interval)=>{const id=++sequence;timers.set(id,{fn,at:now+Math.max(1,Number(ms)||0),interval});return id;};
  w.setTimeout=(fn,ms)=>add(fn,ms,0);w.setInterval=(fn,ms)=>add(fn,ms,Math.max(1,Number(ms)||0));
  w.clearTimeout=w.clearInterval=id=>timers.delete(id);
  w.console={log(){},info(){},warn(...a){events.push(a);},error(...a){errors.push(a);}};
  const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
  async function advance(ms) {
    const end=now+ms;let count=0;
    while(true){await flush();const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at||a[0]-b[0])[0];if(!next)break;
      if(++count>5000)throw Error('Synthetic clock runaway');const [id,t]=next;now=t.at;timers.delete(id);if(t.interval)timers.set(id,{...t,at:now+t.interval});t.fn();}
    now=end;await flush();
  }
  const root=doc.querySelector('iframe').contentDocument;
  root.body.innerHTML='<audio id="auditionAudio" hidden></audio><iframe class="ans-insertvideo-online"></iframe>';
  root.querySelector('iframe').getClientRects=()=>[{width:500,height:300}];
  const inner=root.querySelector('iframe').contentDocument;
  const players=[];
  function player(type=kind,id=type==='audio'?'audio_html5_api':'video_html5_api') {
    const element=inner.createElement(type);element.id=id;element.src='https://media.invalid/synthetic.mp4';
    const state={paused:true,ended:false,seeking:false,currentTime:0,duration:100,readyState:4,error:null,calls:0,reject:[]};
    for(const key of ['paused','ended','seeking','currentTime','duration','readyState','error'])Object.defineProperty(element,key,{configurable:true,get:()=>state[key],set:v=>{state[key]=v;}});
    element.play=()=>{state.calls++;const failure=state.reject.shift();if(failure)return Promise.reject(new w.DOMException('synthetic playback refusal',failure));state.paused=false;element.dispatchEvent(new w.Event('play'));return Promise.resolve();};
    element.pause=()=>{state.paused=true;element.dispatchEvent(new w.Event('pause'));};
    inner.body.append(element);const item={element,state,end(){state.ended=true;state.paused=true;state.currentTime=100;element.dispatchEvent(new w.Event('ended'));}};players.push(item);return item;
  }
  if(!delayed)player();
  function credit(node=doc.querySelector('#lesson-a')){node.querySelector('.jobUnfinishCount').value='0';if(!node.querySelector('.icon_Completed'))node.append(Object.assign(doc.createElement('span'),{className:'icon_Completed'}));}
  if(credited)credit();
  const installable=readFileSync(new URL('../../dist/XXT.user.js',import.meta.url),'utf8');
  let clicks=0;
  doc.querySelector('#lesson-b .posCatalog_name').onclick=()=>{clicks++;doc.querySelector('#lesson-a').classList.remove('posCatalog_active');doc.querySelector('#lesson-b').classList.add('posCatalog_active');inner.body.replaceChildren();player();};
  await flush();
  const inject=()=>w.eval(installable);
  const evaluate=async()=>{inject();await advance(1000);return w.__xuexitongPlayerV3;};
  return {w,doc,root,inner,players,player,credit,timers,errors,events,advance,flush,inject,evaluate,get clicks(){return clicks;},get app(){return w.__xuexitongPlayerV3;},
    close(){w.__xuexitongPlayerV3?.destroy();w.__xuexitongTaskSupport?.dispose();w.__xxtFoundationLifetime?.dispose();timers.clear();dom.window.close();}};
}
