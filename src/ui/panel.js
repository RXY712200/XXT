const labels = { automation: '主自动化', video: '视频', audio: '音频', document: '文档', continuation: '安全续接', navigation: '允许小节/章节导航', background: '后台恢复', delays: '随机延迟', restEnabled: '周期休息' };
const names = { video: '视频', audio: '音频', document: '文档', live: '直播（手动）', assessment: '测验（不作答）', unknown: '未知', 'book-knowledge-map': '书籍/知识图谱（仅识别）', 'timed-reader': '计时阅读（仅识别）', 'audio-slides': '音频幻灯（仅识别）', hyperlink: '链接任务（仅识别）', 'legacy-multimedia': '旧式动画（不支持执行）' };
import { actionCategories } from '../runtime/preferences.js';
export function mountPanel(document, app) {
  const host = document.createElement('aside'), notice = document.createElement('aside');
  host.id = 'xxt-control'; notice.id = 'xxt-notice';
  const root = host.attachShadow({mode:'open'}), quick = notice.attachShadow({mode:'open'}), cleanup = [], fields = new Map();
  const common = 'font:12px sans-serif;color:#222;box-sizing:border-box;';
  root.innerHTML = `<style>:host{position:fixed;right:8px;top:8px;z-index:2147483000;pointer-events:none;${common}}details{pointer-events:auto;background:#fafafa;border:1px solid #bbb;border-radius:4px;box-shadow:0 1px 3px #ccc;padding:5px;max-width:calc(100vw - 16px)}summary{cursor:pointer;padding:3px}section{width:264px;max-width:calc(100vw - 30px);max-height:clamp(24px,calc(100vh - var(--xxt-notice-height,260px) - 200px),65vh);overflow-y:auto;overflow-wrap:anywhere}section details{box-shadow:none;margin:5px 0}label{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:5px 1px}input[type=number]{width:90px;min-width:0}button{min-height:26px;margin:3px;padding:3px 6px}pre{white-space:pre-wrap;overflow-wrap:anywhere;margin:4px 0}textarea{box-sizing:border-box;width:100%;height:100px}#error{color:#8b2020}</style><details><summary>学习设置</summary><section><details id="lesson"><summary>当前小节 · 检测与手动执行</summary><pre id="status"></pre><div id="actions"></div></details><details id="features"><summary>功能开关</summary></details><details id="delays"><summary>随机延迟（毫秒）</summary></details><details id="rest"><summary>周期休息</summary><pre id="rest-status"></pre></details><details id="diagnostics"><summary>任务记录与诊断</summary><pre id="records">仅保留最多100条脱敏事件；日志不授权完成或导航。</pre><div id="reports"></div><textarea hidden readonly aria-label="脱敏诊断"></textarea></details><div id="defaults"></div><small>恢复默认将暂停自动化；需明确开始。开发测试版。</small><pre id="error" role="alert"></pre></section></details>`;
  quick.innerHTML = `<style>:host{position:fixed;right:8px;bottom:86px;width:min(336px,calc(100% - 16px));z-index:2147483000;pointer-events:none;${common}}#runtime{width:100%;pointer-events:auto;background:#fafafa;border:1px solid #bbb;border-radius:4px;padding:6px;box-sizing:border-box;line-height:1.35}p{margin:0 0 4px;white-space:pre-wrap;overflow-wrap:anywhere;max-height:3.6em;overflow:auto}dl{margin:0;display:grid;grid-template-columns:1fr;gap:2px}dl div{overflow-wrap:anywhere}button{font:inherit;min-height:26px;padding:3px 6px;margin:2px}[hidden]{display:none}</style><div id="runtime"><p role="status" aria-live="polite" aria-atomic="true"></p><dl aria-live="off"><div data-phase></div><div data-task></div><div data-progress></div><div data-credit></div><div data-local></div><div data-next></div><div data-countdown></div><div data-recovery hidden></div><div data-rest hidden></div><div data-failure hidden></div></dl><span></span></div>`;
  let disposed = false;
  function listen(node,event,fn) { node.addEventListener(event,fn); cleanup.push(()=>node.removeEventListener(event,fn)); }
  function act(fn) { if(disposed)return;try{fn();root.querySelector('#error').textContent='';}catch{root.querySelector('#error').textContent='操作失败：请检查设置或存储；停止状态不会被绕过。';}render(); }
  function button(parent,text,fn){const node=document.createElement('button');node.textContent=text;listen(node,'click',()=>act(fn));parent.append(node);}
  button(quick.querySelector('span'),'停止自动操作',app.stop);
  button(quick.querySelector('span'),'重新自动检测',app.start);
  for(const [text,fn] of [['开始',app.start],['停止',app.stop],['恢复',app.resume],['重扫当前小节',app.rescan]])button(root.querySelector('#actions'),text,fn);
  if(app.deferUnknown)button(root.querySelector('#actions'),'保留未知附件并继续已知任务',app.deferUnknown);
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
  const actionFields=[];const actionNames={videoStart:'视频启动',audioStart:'音频启动',nextVideo:'下一视频',nextAudio:'下一音频',documentScroll:'文档采样间隔',nextDocument:'下一文档',nextLesson:'下一小节',nextChapter:'下一章节',assessment:'测验交接',liveEntry:'直播登记等待'};
  const group=document.createElement('details');group.innerHTML='<summary>分类延迟（未配置时继承总范围）</summary>';root.querySelector('#delays').append(group);
  for(const category of actionCategories){const row=document.createElement('label');row.textContent=actionNames[category];const enabled=document.createElement('input'),min=document.createElement('input'),max=document.createElement('input');enabled.type='checkbox';min.type=max.type='number';min.style.width=max.style.width='60px';row.append(enabled,min,max);group.append(row);
    for(const input of [enabled,min,max])listen(input,'change',()=>act(()=>app.update({actionRanges:{...app.view().settings.actionRanges,[category]:{enabled:enabled.checked,minMs:Number(min.value),maxMs:Number(max.value)}}})));
    actionFields.push({category,enabled,min,max});}
  function text(node,value){if(node.textContent!==value)node.textContent=value;}
  function render(){if(disposed)return;const view=app.view(),task=view.task;
    for(const {category,enabled,min,max}of actionFields){const r=view.settings.actionRanges?.[category];enabled.checked=r?.enabled??true;if(root.activeElement!==min)min.value=r?.minMs??view.settings.minMs;if(root.activeElement!==max)max.value=r?.maxMs??view.settings.maxMs;}
    for(const [key,input]of fields)if(input.type==='checkbox')input.checked=view.settings[key];else if(root.activeElement!==input)input.value=view.settings[key]??'';
    text(quick.querySelector('[role=status]'),view.message);
    const phases={detecting:'检测中',running:'运行中',waiting:'等待中',stopped:'已停止',unsupported:'不支持',navigating:'导航中',recovering:'恢复中',resting:'休息中'};
    const actions={detecting:'识别页面',playing:'播放中',reading:'阅读中','video-start':'视频启动','audio-start':'音频启动','task-start':'任务启动','platform-confirmation':'等待平台完成确认','destination-confirmation':'等待目标与新内容确认','navigation-delay':'等待导航冷却','frame-recovery':'等待框架恢复','recovery-observation':'观察播放恢复','waiting-owner':'等待内容归属',rest:'周期休息',manual:'需人工处理'};
    const upcoming={'next-attachment':'下一附件','next-lesson':'下一小节','next-chapter':'下一章节','video-start':'视频启动','audio-start':'音频启动','task-start':'任务启动','waiting-owner':'等待内容归属',none:'无'};
    const credit={confirmed:'已独立确认',unconfirmed:'未确认',contradictory:'标记矛盾',unavailable:'暂不可确认'};
    const local={running:'执行中','local-ended':'本地已结束（非平台完成）',restored:'恢复的本地结束记录（非平台完成）',unresolved:'未解决','not-started':'尚未执行'};
    text(quick.querySelector('[data-phase]'),`状态：${phases[view.runtimePhase]||'等待中'} · ${actions[view.currentAction]||view.message}`);
    text(quick.querySelector('[data-task]'),`任务：${names[task?.kind]||'等待识别'}${task?` · 附件 ${task.ordinal+1}/${view.total}`:''}`);
    text(quick.querySelector('[data-progress]'),`进度：已知 ${view.knownCount??view.total??0} 项 · 本地结束 ${view.locallyEndedCount??0} 项`);
    text(quick.querySelector('[data-credit]'),`平台完成：${credit[view.platformCredit]||(view.platformConfirmed?'已独立确认':'未确认')}`);
    text(quick.querySelector('[data-local]'),`本地执行：${local[view.localResult]||(view.localDone?'本地已结束（非平台完成）':'尚未执行')}`);
    text(quick.querySelector('[data-next]'),`后续：${upcoming[view.nextAction]||'无'}`);
    const countdown=view.remainingMs===null||view.remainingMs===undefined?null:Math.max(0,view.remainingMs);
    const clockLabel={navigation:upcoming[view.nextAction]||'导航',acknowledgement:'目标确认',attachment:actions[view.currentAction]||'附件启动',recovery:view.currentAction==='recovery-observation'?'恢复观察':'等待框架恢复',owner:'等待内容归属',rest:'周期休息',startup:'初始化'};
    text(quick.querySelector('[data-countdown]'),countdown===null?(view.currentAction==='platform-confirmation'?'等待平台完成确认（无计时）':'计时：无待执行期限'):`${clockLabel[view.deadlineKind]||'动作'}：还剩 ${(countdown/1000).toFixed(1)} 秒`);
    for(const [selector,show,value] of [
      ['[data-recovery]',view.recoveryAttempt>0,`恢复：${view.recoveryAttempt||0}/${view.recoveryBudget||3} 次`],
      ['[data-rest]',view.restRemaining>0,`周期休息：剩余 ${Math.ceil((view.restRemaining||0)/1000)} 秒`],
      ['[data-failure]',view.failureText&&view.failureCode!=='lesson-not-credited',`原因：${view.failureText||''}${view.manualRequired?'；请手动重新检测/恢复':''}`]]){
      const node=quick.querySelector(selector);node.hidden=!show;text(node,value);
    }
    host.style.setProperty('--xxt-notice-height',`${notice.getBoundingClientRect().height||260}px`);
    const states={READY:'等待启动',STARTING:'启动中',RUNNING:task?.kind==='live'?'人工等待':'运行中',WAITING_PLATFORM:'等待平台信用',RESTORED_WAITING_PLATFORM:'已恢复本地结束记录，等待平台确认',UNRESOLVED:'未解决',UNSUPPORTED:'不支持',PAUSED:'暂停',CANCELLED:'已取消'};
    text(root.querySelector('#status'),`状态：${view.message} ${states[view.taskState]||''}\n任务：${names[task?.kind]||'等待识别'} ${task?`${task.ordinal+1}/${view.total}`:''}\n本地结果：${view.localDone?'已处理，非平台完成':'尚未处理'}\n平台信用：${view.platformConfirmed?'已确认':'未确认'}\n延迟：${view.delayed?'等待中':'无'}\n未知、专有阅读器及未验证直播需人工处理。`);
    text(root.querySelector('#rest-status'),`休息剩余：${Math.max(0,Math.ceil(view.restRemaining/1000))}秒`);
    if(!report.hidden)report.value=app.exportDiagnostics();
  }
  document.body.append(host,notice);render();return Object.freeze({host,notice,render,destroy(){if(disposed)return;disposed=true;for(const remove of cleanup)remove();host.remove();notice.remove();}});
}
