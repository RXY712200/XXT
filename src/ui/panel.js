const labels = { automation: '主自动化', video: '视频', audio: '音频', document: '文档', continuation: '安全续接', navigation: '允许小节/章节导航', background: '后台恢复', delays: '随机延迟', restEnabled: '周期休息' };
const names = { video: '视频', audio: '音频', document: '文档', live: '直播（手动）', assessment: '测验（不作答）', unknown: '未知', 'book-knowledge-map': '书籍/知识图谱（仅识别）', 'timed-reader': '计时阅读（仅识别）', 'audio-slides': '音频幻灯（仅识别）', hyperlink: '链接任务（仅识别）', 'legacy-multimedia': '旧式动画（不支持执行）' };
export function mountPanel(document, app) {
  const host = document.createElement('aside'), notice = document.createElement('aside');
  host.id = 'xxt-control'; notice.id = 'xxt-notice';
  const root = host.attachShadow({mode:'open'}), quick = notice.attachShadow({mode:'open'}), cleanup = [], fields = new Map();
  const common = 'font:12px sans-serif;color:#222;box-sizing:border-box;';
  root.innerHTML = `<style>:host{position:fixed;right:8px;top:8px;z-index:2147483000;pointer-events:none;${common}}details{pointer-events:auto;background:#fafafa;border:1px solid #bbb;border-radius:4px;box-shadow:0 1px 3px #ccc;padding:5px;max-width:calc(100vw - 16px)}summary{cursor:pointer;padding:3px}section{width:264px;max-width:calc(100vw - 30px);max-height:clamp(48px,calc(75vh - 220px),65vh);overflow-y:auto;overflow-wrap:anywhere}section details{box-shadow:none;margin:5px 0}label{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:5px 1px}input[type=number]{width:90px;min-width:0}button{min-height:26px;margin:3px;padding:3px 6px}pre{white-space:pre-wrap;overflow-wrap:anywhere;margin:4px 0}textarea{box-sizing:border-box;width:100%;height:100px}#error{color:#8b2020}</style><details><summary>学习设置</summary><section><details id="lesson"><summary>当前小节 · 检测与手动执行</summary><pre id="status"></pre><div id="actions"></div></details><details id="features"><summary>功能开关</summary></details><details id="delays"><summary>随机延迟（毫秒）</summary></details><details id="rest"><summary>周期休息</summary><pre id="rest-status"></pre></details><details id="diagnostics"><summary>任务记录与诊断</summary><pre id="records">仅保留最多100条脱敏事件；日志不授权完成或导航。</pre><div id="reports"></div><textarea hidden readonly aria-label="脱敏诊断"></textarea></details><div id="defaults"></div><small>恢复默认将暂停自动化；需明确开始。开发测试版。</small><pre id="error" role="alert"></pre></section></details>`;
  quick.innerHTML = `<style>:host{position:fixed;right:8px;bottom:86px;z-index:2147483000;${common}}div{max-width:min(290px,calc(100vw - 16px));background:#fafafa;border:1px solid #bbb;border-radius:4px;padding:6px;box-sizing:border-box}p{margin:0 0 4px;white-space:pre-wrap;overflow-wrap:anywhere;max-height:25vh;overflow:auto}button{font:inherit;min-height:26px;padding:3px 6px;margin:2px}</style><div><p role="status" aria-live="polite" aria-atomic="true"></p><span></span></div>`;
  let disposed = false;
  function listen(node,event,fn) { node.addEventListener(event,fn); cleanup.push(()=>node.removeEventListener(event,fn)); }
  function act(fn) { if(disposed)return;try{fn();root.querySelector('#error').textContent='';}catch{root.querySelector('#error').textContent='操作失败：请检查设置或存储；停止状态不会被绕过。';}render(); }
  function button(parent,text,fn){const node=document.createElement('button');node.textContent=text;listen(node,'click',()=>act(fn));parent.append(node);}
  button(quick.querySelector('span'),'停止自动操作',app.stop);
  button(quick.querySelector('span'),'重新自动检测',app.start);
  for(const [text,fn] of [['开始',app.start],['停止',app.stop],['恢复',app.resume],['重扫当前小节',app.rescan]])button(root.querySelector('#actions'),text,fn);
  button(root.querySelector('#defaults'),'恢复默认',app.restore);
  const report=root.querySelector('textarea');
  button(root.querySelector('#reports'),'查看脱敏诊断',()=>{report.hidden=false;report.value=app.exportDiagnostics();});
  button(root.querySelector('#reports'),'选中报告',()=>{report.hidden=false;report.value=app.exportDiagnostics();report.focus();report.select();});
  button(root.querySelector('#reports'),'清空诊断',app.clearDiagnostics);
  for(const [key,text] of Object.entries({...labels,minMs:'延迟下限 ms',maxMs:'延迟上限 ms',restCount:'休息任务数（先配置）',restMs:'休息时长 ms（先配置）'})){
    const label=document.createElement('label'),input=document.createElement('input');label.textContent=text;
    input.type=key in labels?'checkbox':'number';input.dataset.setting=key;
    listen(input,'change',()=>act(()=>app.update({[key]:input.type==='checkbox'?input.checked:input.value===''?null:Number(input.value)})));
    label.append(input);root.querySelector(['delays','minMs','maxMs'].includes(key)?'#delays':['restEnabled','restCount','restMs'].includes(key)?'#rest':'#features').append(label);fields.set(key,input);
  }
  function text(node,value){if(node.textContent!==value)node.textContent=value;}
  function render(){if(disposed)return;const view=app.view(),task=view.task;
    for(const [key,input]of fields)if(input.type==='checkbox')input.checked=view.settings[key];else if(root.activeElement!==input)input.value=view.settings[key]??'';
    text(quick.querySelector('[role=status]'),view.message);
    const states={READY:'等待启动',STARTING:'启动中',RUNNING:task?.kind==='live'?'人工等待':'运行中',WAITING_PLATFORM:'等待平台信用',UNRESOLVED:'未解决',UNSUPPORTED:'不支持',PAUSED:'暂停',CANCELLED:'已取消'};
    text(root.querySelector('#status'),`状态：${view.message} ${states[view.taskState]||''}\n任务：${names[task?.kind]||'等待识别'} ${task?`${task.ordinal+1}/${view.total}`:''}\n本地结果：${view.localDone?'已处理，非平台完成':'尚未处理'}\n平台信用：${view.platformConfirmed?'已确认':'未确认'}\n延迟：${view.delayed?'等待中':'无'}\n未知、专有阅读器及未验证直播需人工处理。`);
    text(root.querySelector('#rest-status'),`休息剩余：${Math.max(0,Math.ceil(view.restRemaining/1000))}秒`);
    if(!report.hidden)report.value=app.exportDiagnostics();
  }
  document.body.append(host,notice);render();return Object.freeze({host,notice,render,destroy(){if(disposed)return;disposed=true;for(const remove of cleanup)remove();host.remove();notice.remove();}});
}
