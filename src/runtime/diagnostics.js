const categories = new Set(['recognition','selection','outcome','recovery','manual','credit','navigation','stop','settings','storage']);
const kinds = new Set(['video','audio','document','live','assessment','unknown']);
const states = new Set(['DISCOVERED','PENDING','READY','STARTING','RUNNING','LOCAL_COMPLETED','WAITING_PLATFORM','RESTORED_WAITING_PLATFORM','FAILED','UNRESOLVED','UNSUPPORTED','PAUSED','CANCELLED']);
const phases=new Set(['unknown','detecting','running','waiting','stopped','unsupported','navigating','recovering','resting']);
const stages=new Set(['event','legacy','completion-observed','completion-validated','target-selected','target-rejected','permit-issued','queued','queue-rejected','cooldown-started','cooldown-expired','permit-renewed','permit-consumed','permit-rejected','native-activation','native-returned','destination-active','destination-content','acknowledged','cancelled','failed','timeout']);
const outcomes=new Set(['unknown','observed','accepted','rejected','pending','succeeded','cancelled','failed']);
const deadlines=new Set(['none','navigation','acknowledgement','attachment','recovery','owner','rest','startup']);
export const reasons=Object.freeze({
  none:'', 'legacy-unrecorded':'旧版记录未采集原因', 'no-eligible-target':'没有可安全前往的学习项',
  'assessment-boundary':'测验边界无法安全延后', 'assessment-limit':'连续测验超过安全遍历上限', 'source-not-unique':'来源目录身份不唯一',
  'uncertain-target-ancestry':'目标章节归属未确认', 'inactive-or-busy-context':'当前任务或导航仍在运行', 'unsafe-completion-context':'完成证据或任务归属不安全',
  'not-isolated-optional-assessment':'并非独立可延后的章节测验', 'unverified-preceding-learning':'前序学习项尚未独立确认完成', 'lesson-not-credited':'等待平台完成确认',
  'unsupported-boundary':'存在未知或必须处理的任务', 'unresolved-execution':'当前任务仍未解决', 'unfinished-local-task':'本地任务尚未结束',
  'incomplete-task-evidence':'平台仍显示附件未完成', 'media-still-active':'媒体仍在播放或定位，不能离开',
  'permit-invalid':'导航许可无效或已失效', 'permit-expired':'导航许可已过期', 'queue-busy':'已有任务或导航动作，未重复排队',
  'native-target-invalid':'原生目标不存在或归属不唯一', 'native-activation-threw':'原生激活调用抛出异常', 'destination-mismatch':'目标小节或课程身份不匹配',
  'catalog-mismatch':'目录拓扑改变，不能确认目标', 'destination-unsafe':'目标页面含验证或不安全任务', 'awaiting-target':'内容已变化但授权目标尚未激活',
  'navigation-unacknowledged':'原生激活后未在期限内确认目标及新内容', 'navigation-ack-mismatch':'返回内容与授权目标不匹配',
  'navigation-effect-failed':'原生导航执行失败', 'native-navigation-cancelled':'原生导航等待已取消', 'navigation-denied':'冷却后导航许可未获批准',
  'context-invalidated':'页面或任务上下文已失效', 'context-changed':'页面上下文已改变', 'explicit-stop':'已明确停止自动化', 'automatic-stop':'安全检查已自动暂停', 'destroyed':'脚本已销毁',
  'verification-required':'页面要求验证码或身份验证', 'contradictory-credit':'平台完成标记与未完成计数矛盾', 'readiness':'等待当前框架或播放器就绪',
  'terminal-recovery':'当前小节恢复预算已终止', 'manual-required':'需要人工核对后重新检测', 'storage-unavailable':'本地存储不可用，已停止',
  'adapter-start-rejected':'播放器或阅读器启动失败', 'adapter-unavailable':'当前任务没有可执行适配器', 'unsupported-task-boundary':'当前任务不支持自动处理',
  'autoplay-denied-after-fallback':'浏览器拒绝正常及静音播放', 'media-error-1':'媒体加载被中止', 'media-error-2':'媒体网络读取失败', 'media-error-3':'媒体解码失败', 'media-error-4':'主播放器媒体源不受支持',
  'unsupported-media':'主播放器不支持当前媒体', 'play-aborted':'播放请求被中止', 'play-failed':'播放请求失败', 'play-timeout':'播放请求超时', 'readiness-timeout':'播放器就绪超时',
  'recovery-exhausted':'播放恢复次数已耗尽', 'reader-owner-replaced':'阅读区域已替换', 'reader-invalid-geometry':'无法确认文档滚动范围', 'reader-no-observed-movement':'未观察到文档滚动', 'reader-readiness-timeout':'阅读区域就绪超时',
  'reader-inaccessible-or-cyclic':'阅读区域包含不可访问框架', 'reader-unsupported-document':'当前文档格式不受支持', 'reader-unsupported-media-surface':'阅读区域含不支持的媒体'
});
export function safeReason(code){return Object.hasOwn(reasons,code)?code:'manual-required';}
export function createDiagnostics(storage, now=()=>Date.now()) {
  let rows = [];
  const key='xxt.decisions.v1';
  const basic=row=>row&&categories.has(row.category)&&(states.has(row.state)||row.state==='OTHER')&&kinds.has(row.kind);
  const fields=['category','state','kind','phase','reason','stage','order','atMs','outcome','deadlineKind','retry'];
  const safe=row=>basic(row)&&Object.keys(row).every(k=>fields.includes(k))&&phases.has(row.phase)&&Object.hasOwn(reasons,row.reason)&&stages.has(row.stage)&&outcomes.has(row.outcome)&&deadlines.has(row.deadlineKind)&&Number.isSafeInteger(row.order)&&row.order>=0&&row.order<=1000000000&&(row.atMs===null||Number.isSafeInteger(row.atMs)&&row.atMs>=0&&row.atMs<=2147483647)&&Number.isInteger(row.retry)&&row.retry>=0&&row.retry<=3;
  try {
    const saved=JSON.parse(storage?.getItem(key)||'[]');
    if(Array.isArray(saved)&&saved.length<=100&&saved.every(row=>basic(row)&&Object.keys(row).every(k=>['category','state','kind'].includes(k))))
      rows=saved.map((row,i)=>Object.freeze({...row,phase:'unknown',reason:'legacy-unrecorded',stage:'legacy',order:i,atMs:null,outcome:'unknown',deadlineKind:'none',retry:0}));
    else if(saved?.version===2&&Array.isArray(saved.events)&&saved.events.length<=100&&saved.events.every(safe))rows=saved.events.map(row=>Object.freeze({...row}));
  }catch{/* Invalid journal is never evidence or execution authority. */}
  const start=now();let order=rows.length?Math.max(...rows.map(r=>r.order))+1:0;
  function persist(){try{storage?.setItem(key,JSON.stringify({version:2,events:rows}));}catch{/* Optional journal never changes Stop/credit. */}}
  return Object.freeze({ add(category, state, kind, details={}) {
    if (!categories.has(category)) return;
    if(!details||typeof details!=='object')details={};
    rows.push(Object.freeze({ category, state: states.has(state) ? state : 'OTHER', kind: kinds.has(kind) ? kind : 'unknown',
      phase:phases.has(details.phase)?details.phase:'unknown',reason:Object.hasOwn(reasons,details.reason)?details.reason:'none',stage:stages.has(details.stage)?details.stage:'event',
      order:Math.min(order++,1000000000),atMs:Math.min(2147483647,Math.max(0,Math.floor(now()-start))),outcome:outcomes.has(details.outcome)?details.outcome:'unknown',
      deadlineKind:deadlines.has(details.deadlineKind)?details.deadlineKind:'none',retry:Number.isInteger(details.retry)?Math.max(0,Math.min(3,details.retry)):0 }));
    rows = rows.slice(-100);
    persist();
  }, export: () => JSON.stringify({ format: 'xxt-diagnostics-v2', events: rows }), clear() { rows = [];order=0;persist(); } });
}
