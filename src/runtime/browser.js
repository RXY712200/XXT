import { createInventoryReader, inspectInventory } from '../platform/inventory.js';
import { acquireSession } from './session.js';
import { createVideoAdapter } from '../adapters/video.js';
import { createAudioAdapter } from '../adapters/audio.js';
import { createDocumentAdapter } from '../adapters/document.js';
import { createLiveAdapter } from '../adapters/live.js';
import { createNativeNavigation } from './native-navigation.js';
import { createPreferences, sampleDelay } from './preferences.js';
import { createDiagnostics, reasons, safeReason } from './diagnostics.js';
import { runtimePresentation } from './presentation.js';
import { mountPanel } from '../ui/panel.js';
import { evaluateCompletion } from '../core/completion.js';
import { objectiveVideoTab, activateObjectiveTab, videoTabIdentity } from './native-tabs.js';
import { createPartialStore } from './partial.js';
import { createUnattendedRecoveryCoordinator } from './fork-recovery.js';

const singleton = Symbol.for('XXT.browser.runtime.v1');
const localWait = record => ['WAITING_PLATFORM','RESTORED_WAITING_PLATFORM'].includes(record.state);
export function bootstrap(document, { clock, random = Math.random, storage, ui = true } = {}) {
  const window = document.defaultView;
  if (window[singleton]) return window[singleton];
  const url = new URL(document.URL);
  if (url.protocol !== 'https:' || !/(^|\.)chaoxing\.com$/.test(url.hostname) || !/^\/(?:mooc2-ans\/)?mycourse\/studentstudy\/?$/.test(url.pathname)) return null;
  const now = clock?.now || (() => Date.now()), reader = createInventoryReader();
  let safeStorage; try { safeStorage = storage || window.localStorage; } catch { safeStorage = { getItem() { throw Error('denied'); } }; }
  const prefs = createPreferences(safeStorage, now);
  let durableStorage, recoveryStorage;
  try{durableStorage=window.localStorage;recoveryStorage=window.sessionStorage;}catch{durableStorage=recoveryStorage={getItem(){throw Error('denied');},setItem(){throw Error('denied');}};}
  const journal = createDiagnostics(durableStorage,now);
  const log={...journal,add(category,state,kind,details={}){
    const snapshot=c?.snapshot(),record=snapshot?.records.find(r=>['READY','STARTING','RUNNING','UNRESOLVED','UNSUPPORTED'].includes(r.state))||snapshot?.records[0];
    journal.add(category,state||record?.state,kind||record?.kind,{phase:stopped?'stopped':snapshot?.active?'running':'waiting',...details});
  }};
  const partial=createPartialStore(durableStorage);let recovery, recoverySequence=0, explicitRecheck=false;
  let panel, app, c, stopped = prefs.snapshot().stopped || Boolean(prefs.snapshot().error), message = '等待识别', loadingSince = now(), disposed = false, signature = '', pendingContext = null, tabPending = null;
  let failureCode='none';const eventSignatures=new Map();
  function navigationEvent(stage,reason='none'){
    const code=safeReason(reason),key=`${c?.snapshot().generation}|${stage}|${code}`;
    if(eventSignatures.get(stage)!==key){
      eventSignatures.set(stage,key);
      log.add(stage.startsWith('completion-')?'credit':'navigation',null,null,{stage,reason:code,phase:['failed','timeout','cancelled'].includes(stage)?'stopped':['target-rejected','completion-observed','completion-validated'].includes(stage)?(c?.snapshot().active?'running':'waiting'):'navigating',
        outcome:stage.includes('rejected')?'rejected':['failed','timeout'].includes(stage)?'failed':stage==='cancelled'?'cancelled':stage==='acknowledged'?'succeeded':stage==='queued'||stage==='cooldown-started'?'pending':['completion-validated','target-selected','permit-issued','permit-consumed','permit-renewed'].includes(stage)?'accepted':'observed',
        deadlineKind:stage==='queued'||stage.startsWith('cooldown-')?'navigation':['native-activation','native-returned','destination-active','destination-content'].includes(stage)?'acknowledgement':'none',retry:recovery?.getStatus().attempts||0});
    }
    if(['failed','timeout','target-rejected','queue-rejected','permit-rejected','cancelled'].includes(stage))failureCode=code;
    else if(stage==='queued'||stage==='acknowledged')failureCode='none';
    if(stage==='failed'||stage==='timeout')message=`${reasons[code]}；请明确重新检测`;
  }
  const settings = () => prefs.snapshot().settings;
  const wrap = (kind, factory) => ({ recognize: task => settings()[kind] && factory({ background: settings().background }).recognize(task),
    start: context => factory({ background: settings().background }).start(context) });
  function arm() { if (c && !stopped && !disposed) c.scheduleRuntime({ key: 'watch', delay: 500, execute: tick }); }
  function contentChanged(previous, next) {
    const old = previous.tasks.filter(t => t.kind !== 'assessment'), tasks = next.tasks.filter(t => t.kind !== 'assessment');
    return next.documents.some(doc => !previous.documents.includes(doc)) || old.length !== tasks.length || tasks.some((task,i) =>
      task.owner !== old[i]?.owner || task.player !== old[i]?.player || task.mediaSource?.identity !== old[i]?.mediaSource?.identity);
  }
  function sameLessonCatalog(previous,next) {
    return previous && next.pageURL===previous.pageURL && next.courseKey===previous.courseKey && next.lesson?.key===previous.lesson?.key &&
      next.chapters.length===previous.chapters.length && next.chapters.every((item,i)=>item.key===previous.chapters[i].key && item.title===previous.chapters[i].title) &&
      next.catalog.length===previous.catalog.length && next.catalog.every((item,i)=>{
        const old=previous.catalog[i];return item.key===old.key && item.title===old.title && item.chapterKey===old.chapterKey &&
          item.restricted===old.restricted && JSON.stringify(item.ancestry)===JSON.stringify(old.ancestry);
      });
  }
  const inactiveMedia = snapshot => !snapshot.documents.some(doc=>[...doc.querySelectorAll('video,audio')].some(player=>(!player.paused&&!player.ended)||player.seeking));
  const ownedKnown = task => ['video','audio','document'].includes(task.kind) && task.identity==='verified' && task.key && task.ownerKey &&
    (task.kind==='document' || task.mediaSource?.usable);
  function loadingReplacement(previous,next) {
    return previous?.status==='verified' && previous.tasks.length>0 && previous.tasks.every(ownedKnown) && !previous.assessment && !next.assessment &&
      sameLessonCatalog(previous,next) && next.status==='loading' && next.hazards.every(code=>code.startsWith('loading-')) && inactiveMedia(next) &&
      next.tasks.every(task=>previous.tasks.some(old=>task.identity==='verified' && task.key===old.key && task.kind===old.kind && task.ownerKey===old.ownerKey && task.ordinal===old.ordinal));
  }
  function equivalentReplacement(previous,next) {
    return sameLessonCatalog(previous,next) && inspectInventory(next).valid && !next.assessment && inactiveMedia(next) &&
      previous.tasks.length===next.tasks.length && next.tasks.every((task,i)=>{
        const old=previous.tasks[i];return ownedKnown(task) && task.key===old.key && task.ownerKey===old.ownerKey && task.kind===old.kind &&
          task.ordinal===old.ordinal && task.mediaSource?.identity===old.mediaSource?.identity;
      });
  }
  const session = acquireSession(document, { clock, adapters: { video: wrap('video', createVideoAdapter), audio: wrap('audio', createAudioAdapter),
    document: wrap('document', options=>createDocumentAdapter({...options,random,interval:settings().actionRanges?.documentScroll?()=>sampleDelay(settings(),random,'documentScroll'):undefined})), live: createLiveAdapter() }, autoContinue: true,
    delayFor: (category,task) => {
      if(prefs.consumeRest())return 0;
      const next = c.snapshot().records.some(localWait);
      const action = next ? {video:'nextVideo',audio:'nextAudio',document:'nextDocument',live:'liveEntry'}[task.kind] : {audio:'audioStart',video:'videoStart',live:'liveEntry'}[task.kind];
      return action && (next || settings().actionRanges?.[action]) ? sampleDelay(settings(),random,action) : 0;
    },
    canStart: () => !stopped && recovery?.getStatus().stage !== 'terminal' && settings().automation && !prefs.resting() &&
      (settings().continuation || !c.snapshot().records.some(localWait)),
    onNavigationEvent:navigationEvent,
    onLocalResult(task) { partial.record(task);prefs.record(task.key, task.kind);recovery?.confirmProgress();log.add('outcome','WAITING_PLATFORM',task.kind); },
    onBound(next) {
      log.add('recognition');
      failureCode='none';
      if(c && next.status==='verified')try{c.restorePartial(partial.bind(next,{recheck:explicitRecheck || !next.tasks.length && evaluateCompletion(next).lessonConfirmed}));}catch{halt('未解决附件范围已改变；请明确重扫');return;}
      if(c?.snapshot().records.some(r=>r.state==='RESTORED_WAITING_PLATFORM'))message='已恢复本地结束记录，等待平台独立确认';
      recovery?.cancel();recovery?.restore();arm();
    },
    onInvalidated(reason) {
      if (!c || stopped || disposed || reason === 'inventory-replaced') return;
      if (!['context-invalidated','context-changed','continuation-context-invalid'].includes(reason)) {
        const code=['failed','timeout'].includes(c.snapshot().navigation.stage)?safeReason(c.snapshot().navigation.reason):safeReason(reason);
        halt(`${reasons[code]}；已暂停，请明确重扫`,true,code);return;
      }
      const previous = c.snapshot().inventory, next = reader.scan(document);
      recovery?.cancel();
      if(next.status==='unsafe'||next.status==='unsupported'){
        const code=next.hazards.includes('verification-required')?'verification-required':'context-invalidated';
        halt(`${reasons[code]}；请明确重扫`,true,code);return;
      }
      if (loadingReplacement(previous,next)) {
        pendingContext={previous,courseKey:previous.courseKey,lessonKey:previous.lesson.key,sameLesson:true,until:now()+10000};
        if(!recovery.beginReadinessWait()){
          pendingContext=null;if(recovery.getStatus().stage!=='terminal')halt('加载恢复未获授权，请明确重扫');return;
        }
        message='原任务已取消，等待当前小节框架重建（最多10秒）';arm();return;
      }
      // User-developed prior-credit continuation: reread authoritative evidence,
      // stable catalog topology and ordered content identities; never replay ended history.
      const sameCatalog = sameLessonCatalog(previous,next);
      const known = task => ['video','audio','document'].includes(task.kind);
      if (sameCatalog && next.status==='verified' && previous.tasks.every(known) && next.tasks.every(known) &&
        next.tasks.length===previous.tasks.length && next.tasks.every((task,i)=>task.key===previous.tasks[i].key && task.kind===previous.tasks[i].kind && task.mediaSource?.identity===previous.tasks[i].mediaSource?.identity) &&
        !next.tasks.some(task=>task.player && !task.player.paused && !task.player.ended) && evaluateCompletion(next).lessonConfirmed) {
        c.bind(next);message='已重新核验平台完成与任务归属';return;
      }
      // Whole-lesson credit can survive removal of completed known attachments.
      // Do not turn disappearance of a prior unknown task into automatic authority.
      if (previous && next.status === 'verified' && previous.courseKey === next.courseKey && previous.lesson?.key === next.lesson?.key &&
        previous.tasks.every(t => ['video','audio','document'].includes(t.kind)) && next.tasks.length === 0 &&
        previous.catalog.length === next.catalog.length && previous.catalog.every((item,i) => item.key===next.catalog[i].key && item.title===next.catalog[i].title && item.chapterKey===next.catalog[i].chapterKey) &&
        evaluateCompletion(next).lessonConfirmed) { c.bind(next); message='已独立确认平台信用，重新绑定完成小节'; return; }
      if (previous && next.status !== 'unsafe' && next.status !== 'unsupported' && next.lesson?.key && next.lesson.key !== previous.lesson?.key) {
        if (next.status === 'verified' && contentChanged(previous,next)) { c.bind(next); c.startNext(); message = '已重新识别新小节'; return; }
        pendingContext = { previous, courseKey: next.courseKey, lessonKey: next.lesson.key, until: now()+10000 };
        message = '目录已改变，等待新小节内容独立确认'; arm(); return;
      }
      if (previous && next.status==='verified' && previous.courseKey===next.courseKey && previous.lesson?.key===next.lesson?.key &&
        recovery?.requestRecovery('frame-replaced')) { message='正在有限恢复当前小节';return; }
      halt('任务已失效或导航未确认：请明确重扫');
    } });
  c = session.coordinator;
  recovery=createUnattendedRecoveryCoordinator({sessionStorage:recoveryStorage,now,
    setTimeout(fn,delay){const key=`recovery-${++recoverySequence}`;return c.requestRuntime({key,delay,execute:fn})?key:null;},
    clearTimeout:key=>c.cancelRuntime(key),location:{reload(){halt('恢复预算已达终点；不自动刷新');}}}, {
    identity(){const s=reader.scan(document);return (s.status==='verified'||pendingContext?.sameLesson&&loadingReplacement(pendingContext.previous,s))&&s.courseKey&&s.lesson?.key?JSON.stringify([s.courseKey,s.lesson.key]):null;},
    safeLoading(){return !stopped && pendingContext?.sameLesson && loadingReplacement(pendingContext.previous,reader.scan(document));},
    safe(){const s=reader.scan(document);return !stopped&&s.status==='verified'&&!s.assessment&&s.tasks.every(t=>['video','audio','document'].includes(t.kind))&&!(c.snapshot().inventory?.tasks.some(t=>['unknown','assessment'].includes(t.kind)));},
    notice(text){message=text;log.add('recovery',null,null,{phase:'recovering',reason:'readiness',retry:recovery?.getStatus().attempts||0});panel?.render();},fail(text){
      if(recovery?.getStatus().stage==='terminal'){stopped=true;failureCode='terminal-recovery';c.stop();message=text;log.add('recovery','PAUSED',null,{phase:'stopped',reason:'terminal-recovery',retry:recovery.getStatus().attempts});panel?.render();}
      else halt(text);
    },canReload:()=>false,
    fingerprint(){const s=reader.scan(document);return JSON.stringify([s.courseKey,s.lesson?.key,s.catalog.map(t=>t.key)]);},
    progress(){return c.snapshot().records.some(r=>r.state==='RUNNING'&&c.snapshot().inventory.tasks.find(t=>t.key===r.key)?.player?.currentTime>0);},
    retry(){const next=reader.scan(document);if(next.status==='verified'){c.bind(next);c.startNext();}else halt('恢复时内容未就绪');}
  });
  const port = createNativeNavigation(document, reader, () => c.snapshot().inventory);
  function halt(reason, persist = true, code='manual-required') {
    stopped = true;failureCode=code;pendingContext=null;c.stop(code==='explicit-stop'?'explicit-stop':'automatic-stop');message = reason;log.add('stop',null,null,{reason:safeReason(code),phase:'stopped'});
    recovery?.markExplicitStop();
    if (persist) try { prefs.stop(); } catch { message = '本地存储失败：已安全停止'; }
    panel?.render();
  }
  function tick() {
    if (disposed || stopped) return;
    if (prefs.snapshot().error) { log.add('storage'); halt('本地存储异常：已安全停止',false); return; }
    if (c.snapshot().stopped) { halt('自动化已暂停，请手动恢复'); return; }
    if (c.snapshot().diagnostic === 'navigation-denied') { halt('导航许可已失效，请重新确认平台信用后重扫'); return; }
    const state = c.snapshot(), snapshot = state.inventory;
    if (!snapshot) return;
    const completion=evaluateCompletion(snapshot);
    const contradictory=completion.fresh.lesson?.credit.status==='contradictory'||completion.fresh.tasks.some(t=>t.credit.status==='contradictory');
    if(completion.fresh.lesson?.credit.status==='confirmed'||completion.fresh.lesson?.credit.reason==='conflicting-markers')navigationEvent('completion-observed',completion.safe?'none':contradictory?'contradictory-credit':'unsafe-completion-context');
    if(completion.lessonConfirmed)navigationEvent('completion-validated');
    if (tabPending) {
      const next = reader.scan(document), title = document.querySelector('.prev_title');
      if (next.courseKey !== tabPending.courseKey || next.lesson?.key !== tabPending.lessonKey || next.status === 'unsafe') { tabPending = null; halt('页签归属变化：请手动重扫'); return; }
      if (next.status === 'verified' && contentChanged(tabPending.previous,next) && /^(?:\d+\s*)?视频$/.test((title?.getAttribute('title') || title?.textContent || '').trim())) {
        tabPending = null; explicitRecheck=true;c.bind(next);explicitRecheck=false;c.startNext(); return;
      }
      if (now() >= tabPending.until) { tabPending = null; halt('原生视频页签加载超时，请手动重扫'); return; }
      message = '等待原生视频页签内容（不是完成）'; panel?.render(); return;
    }
    if (pendingContext) {
      const next = reader.scan(document);
      if (next.status === 'unsafe' || next.status === 'unsupported' || next.courseKey !== pendingContext.courseKey || next.lesson?.key !== pendingContext.lessonKey) {
        pendingContext = null; halt('新小节归属不稳定，请手动重扫'); return;
      }
      if (pendingContext.sameLesson && next.status==='verified') {
        const {previous,until}=pendingContext;
        if (now()>=until || !equivalentReplacement(previous,next) || !contentChanged(previous,next) ||
          previous.lesson.credit.status==='confirmed'&&!evaluateCompletion(next).lessonConfirmed) { halt('小节重建身份或完成证据不足，请明确重扫');return; }
        pendingContext=null;c.bind(next);c.startNext();return;
      }
      if (!pendingContext.sameLesson && next.status === 'verified' && contentChanged(pendingContext.previous,next)) {
        pendingContext = null; c.bind(next); c.startNext(); return;
      }
      if (now() >= pendingContext.until) { pendingContext = null; halt('新小节内容确认超时，请手动重扫'); return; }
      panel?.render(); return;
    }
    // Leave context acknowledgement exclusively to the native port during navigation.
    if (c.actions().some(a => a.key.endsWith(':navigation-ack') && a.status === 'pending')) { message = '等待真实导航结果'; panel?.render(); return; }
    if (c.actions().some(a => a.key.endsWith(':navigate') && a.status === 'pending')) {
      if (!inspectInventory(snapshot).valid) { c.contextChanged(); return; }
      message = '等待导航延迟'; panel?.render(); return;
    }
    const fresh = inspectInventory(snapshot);
    if (!fresh.valid) {
      const next = reader.scan(document);
      if (next.status === 'unsafe' || next.status === 'unsupported') { const code=next.hazards.includes('verification-required')?'verification-required':'context-invalidated';halt(`${reasons[code]}；需人工处理`,true,code);return; }
      const different = next.courseKey && next.lesson?.key && (next.courseKey !== snapshot.courseKey || next.lesson.key !== snapshot.lesson?.key);
      if (different) { c.contextChanged(); return; }
      if (loadingReplacement(snapshot,next)) { c.contextChanged();return; }
      if (next.status === 'verified' && !next.tasks.length && evaluateCompletion(next).lessonConfirmed) { c.contextChanged(); return; }
      if (next.status === 'verified' && snapshot.status === 'loading' && !state.active) {
        loadingSince = now(); c.bind(next); message = '已重新识别当前小节'; c.startNext(); return;
      }
      // The invalidation callback owns bounded recovery and positive-credit rebinding.
      if (snapshot.status === 'verified' && next.status === 'verified') { c.contextChanged(); return; }
      if (snapshot.status === 'verified') { halt('当前任务结构改变：已取消旧任务，请手动重扫'); return; }
      if (now() - loadingSince >= 10000) { halt('初始化超时：请手动重扫'); return; }
      message = '等待页面或播放器加载'; panel?.render(); return;
    }
    if (prefs.resting()) message = '周期休息中';
    else {
      // Independent whole-lesson credit selects the accepted prior-credit path;
      // neither restored nor current local-ended records establish that credit.
      const decision = settings().navigation && !state.active ? c.navigationDecision(fresh.assessment === 'optional' ? 'assessment' : evaluateCompletion(snapshot).lessonConfirmed ? 'prior-credit' : 'completed') : null;
      if (decision?.allowed) {
        const target=fresh.catalog.find(t=>t.key===decision.permit.targetKey),category=decision.permit.mode==='assessment'||decision.permit.deferred.length?'assessment':target?.chapterKey!==fresh.lesson.chapterKey?'nextChapter':'nextLesson';
        const queued=c.queueNavigation(decision.permit, port, { delay: prefs.consumeRest()?0:sampleDelay(settings(),random,category), refresh: true });
        message=queued?'等待已验证导航':'导航请求未排队：已有动作或上下文失效';
      } else if (!state.active && !state.records.some(r => ['FAILED','UNRESOLVED','UNSUPPORTED','PAUSED','CANCELLED'].includes(r.state))) c.startNext();
      const current = c.snapshot();
      message = c.actions().some(a=>a.key.endsWith(':navigate')&&a.status==='pending') ? '平台完成已核验，等待原生导航' : current.records.some(r => r.kind === 'live' && r.state === 'RUNNING') ? '直播入口需真实手动操作；结果未验证' :
        current.records.some(r => ['FAILED','UNRESOLVED','UNSUPPORTED'].includes(r.state)) ? '失败或不支持：需人工处理' :
        current.active ? '执行或延迟等待中' : current.records.some(r=>r.state==='RESTORED_WAITING_PLATFORM') ? '已恢复本地结束记录，等待平台独立确认' : '等待平台信用或人工操作';
    }
    const after = c.snapshot(), nextSignature = after.records.map(r => r.state).join('|') + fresh.lesson?.credit.status + after.diagnostic;
    if (nextSignature !== signature) {
      signature = nextSignature;
      const task = after.records.find(r => ['READY','STARTING','RUNNING','UNRESOLVED','UNSUPPORTED'].includes(r.state));
      log.add(after.diagnostic === 'recovering-media' ? 'recovery' :
        ['FAILED','UNRESOLVED'].includes(task?.state) ? 'outcome' : task?.kind === 'live' || task?.state === 'UNSUPPORTED' ? 'manual' : 'selection',task?.state,task?.kind,
        {reason:['FAILED','UNRESOLVED','UNSUPPORTED'].includes(task?.state)?safeReason(after.diagnostic):'none',retry:recovery.getStatus().attempts});
    }
    panel?.render();
  }
  function run() {
    if (disposed || prefs.snapshot().error) { message = '本地存储异常：先恢复默认，再明确恢复'; panel?.render(); return false; }
    if (!settings().automation) { message = '主自动化已关闭'; panel?.render(); return false; }
    if (tabPending && !stopped) return true;
    const snapshot = reader.scan(document);
    if (beginObjective(snapshot,true)) { panel?.render(); return true; }
    if (snapshot.status !== 'verified') { halt('页面未就绪或存在安全边界，请稍后明确重扫'); return false; }
    prefs.resume();recovery.resumeExplicitly();stopped = false; pendingContext = null; tabPending = null; loadingSince = now();explicitRecheck=true;c.bind(snapshot);explicitRecheck=false;c.resume(); c.startNext(); panel?.render(); return true;
  }
  app = Object.freeze({ start: run, resume: run, rescan() {
    if (stopped) { message = '停止状态已保留，请明确开始或恢复'; panel?.render(); return false; }
    return run();
  }, stop: () => halt('已明确停止；重载不会自动恢复',true,'explicit-stop'),
    deferUnknown(){
      const inventory=c.snapshot().inventory;
      if(stopped||!inventory||!c.deferUnknown(inventory,keys=>partial.defer(inventory,keys)))throw Error('unsafe-or-busy-defer');
      c.startNext();panel?.render();
    },
    update(patch) {
      try { prefs.update(patch); } catch (error) { if (prefs.snapshot().error) halt('本地存储失败：已安全停止',false); throw error; }
      log.add('settings');
      const state = c.snapshot(), task = state.records.find(r => ['READY','STARTING','RUNNING'].includes(r.state));
      if (!settings().automation || task && settings()[task.kind] === false || 'background' in patch ||
        state.records.some(r => r.state === 'READY') || c.actions().some(a => a.key.endsWith(':navigate') && a.status === 'pending')) halt('设置已保存；相关动作已暂停，请明确恢复');
      panel?.render();
    },
    restore() { try { prefs.restore(); } finally { halt('默认设置操作结束；请明确开始'); } },
    exportDiagnostics: () => log.export(), clearDiagnostics() { log.clear(); },
    view() {
      const state = c.snapshot(), task = state.inventory?.tasks.find(t => state.records.some(r => r.key === t.key && ['READY','STARTING','RUNNING','UNRESOLVED','UNSUPPORTED'].includes(r.state))) ||
        state.inventory?.tasks.findLast(t => state.records.some(r => r.key === t.key && localWait(r))) || state.inventory?.tasks[0];
      const evaluation=state.inventory?evaluateCompletion(state.inventory):null;
      const runtime=runtimePresentation({state,task,evaluation,actions:c.actions(),now:now(),stopped:stopped||state.stopped,pendingContext,tabPending,
        recovery:recovery?.getStatus(),restUntil:prefs.snapshot().restUntil,loadingSince,failureCode});
      return Object.freeze({ settings: settings(), message, task: task ? { kind: task.recognition?.kind || task.kind, ordinal: task.ordinal, recognitionOnly: Boolean(task.recognition) } : null, total: state.records.length,
        taskState: state.records.find(r => r.key === task?.key)?.state,
        localDone: Boolean(evaluation?.fresh.valid && state.records.some(r => r.key === task?.key && localWait(r))), platformConfirmed: evaluation?.lessonConfirmed||false,
        delayed: runtime.remainingMs!==null&&!stopped, ...runtime });
    },
    dispose() { if (disposed) return; disposed = true; recovery?.dispose();document.removeEventListener('click',manualTab,true); session.dispose(); panel?.destroy(); if (window[singleton] === app) delete window[singleton]; if (window.XXT === app) delete window.XXT; }
  });
  function beginObjective(snapshot, explicit = false) {
    const tab = objectiveVideoTab(document);
    if (!tab || !snapshot.courseKey || !snapshot.lesson?.key || snapshot.tasks.length || snapshot.status !== 'loading' ||
      !snapshot.hazards.every(code => code.startsWith('loading-'))) return false;
    if (tabPending && !stopped) return true;
    if (explicit) { prefs.resume();recovery.resumeExplicitly(); stopped = false; pendingContext = null; }
    c.bind(snapshot);
    if (explicit && !c.resume({allowLoading:true})) { halt('目标页归属无法重新验证'); return true; }
    tabPending = { previous: snapshot, courseKey: snapshot.courseKey, lessonKey: snapshot.lesson.key, until: now()+10000 };
    if (!activateObjectiveTab(document,tab)) { tabPending = null; halt('视频页签无法安全激活'); }
    return true;
  }
  function manualTab(event) {
    if (!event.isTrusted || stopped || tabPending || !event.target.closest?.('.prev_white') || !/^(?:\d+\s*)?视频$/.test(event.target.closest('.prev_white').textContent.trim())) return;
    const inventory = c.snapshot().inventory; if (!inventory?.lesson?.key) return;
    if (videoTabIdentity(document,event.target.closest('.prev_white')) !== 'distinct') return;
    tabPending = { previous: inventory, courseKey: inventory.courseKey, lessonKey: inventory.lesson.key, until: now()+10000 };
    stopped = true; c.contextChanged(); stopped = false; arm();
  }
  document.addEventListener('click',manualTab,true);
  window[singleton] = app; window.XXT = app;
  if (ui && document.body) panel = mountPanel(document, app);
  if (stopped || !settings().automation || recovery.getStatus().stopped || recovery.getStatus().stage==='terminal') { stopped = true; c.stop(); if (prefs.snapshot().error) log.add('storage'); message = prefs.snapshot().error ? '本地存储异常：已安全停止' : '已保留停止或终止状态，请明确恢复'; }
  else {
    const snapshot = reader.scan(document);
    if (!beginObjective(snapshot)) {
      c.bind(snapshot);
      if (snapshot.status === 'verified') c.startNext();
      else if (snapshot.status !== 'loading') halt('页面归属或验证状态不明确：需人工处理');
    }
  }
  panel?.render(); return app;
}
