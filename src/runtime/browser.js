import { createInventoryReader, inspectInventory } from '../platform/inventory.js';
import { acquireSession } from './session.js';
import { createVideoAdapter } from '../adapters/video.js';
import { createAudioAdapter } from '../adapters/audio.js';
import { createDocumentAdapter } from '../adapters/document.js';
import { createLiveAdapter } from '../adapters/live.js';
import { createNativeNavigation } from './native-navigation.js';
import { createPreferences, sampleDelay } from './preferences.js';
import { createDiagnostics } from './diagnostics.js';
import { mountPanel } from '../ui/panel.js';

const singleton = Symbol.for('XXT.browser.runtime.v1');
export function bootstrap(document, { clock, random = Math.random, storage, ui = true } = {}) {
  const window = document.defaultView;
  if (window[singleton]) return window[singleton];
  const url = new URL(document.URL);
  if (url.protocol !== 'https:' || !/(^|\.)chaoxing\.com$/.test(url.hostname) || !/^\/(?:mooc2-ans\/)?mycourse\/studentstudy\/?$/.test(url.pathname)) return null;
  const now = clock?.now || (() => Date.now()), reader = createInventoryReader(), log = createDiagnostics();
  let safeStorage; try { safeStorage = storage || window.localStorage; } catch { safeStorage = { getItem() { throw Error('denied'); } }; }
  const prefs = createPreferences(safeStorage, now);
  let panel, app, c, stopped = prefs.snapshot().stopped || Boolean(prefs.snapshot().error), message = '等待识别', loadingSince = now(), disposed = false, signature = '', pendingContext = null;
  const settings = () => prefs.snapshot().settings;
  const wrap = (kind, factory) => ({ recognize: task => settings()[kind] && factory({ background: settings().background }).recognize(task),
    start: context => factory({ background: settings().background }).start(context) });
  function arm() { if (c && !stopped && !disposed) c.scheduleRuntime({ key: 'watch', delay: 500, execute: tick }); }
  function contentChanged(previous, next) {
    const old = previous.tasks.filter(t => t.kind !== 'assessment'), tasks = next.tasks.filter(t => t.kind !== 'assessment');
    return next.documents.some(doc => !previous.documents.includes(doc)) || old.length !== tasks.length || tasks.some((task,i) =>
      task.owner !== old[i]?.owner || task.player !== old[i]?.player || task.mediaSource?.identity !== old[i]?.mediaSource?.identity);
  }
  const session = acquireSession(document, { clock, adapters: { video: wrap('video', createVideoAdapter), audio: wrap('audio', createAudioAdapter),
    document: wrap('document', createDocumentAdapter), live: createLiveAdapter() }, autoContinue: true,
    delayFor: () => c.snapshot().records.some(r => r.state === 'WAITING_PLATFORM') ? sampleDelay(settings(), random) : 0,
    canStart: () => !stopped && settings().automation && !prefs.resting() &&
      (settings().continuation || !c.snapshot().records.some(r => r.state === 'WAITING_PLATFORM')),
    onLocalResult(task) { prefs.record(task.key, task.kind); log.add('outcome','WAITING_PLATFORM',task.kind); },
    onBound() { log.add('recognition'); arm(); },
    onInvalidated(reason) {
      if (!c || stopped || disposed || reason === 'inventory-replaced') return;
      const previous = c.snapshot().inventory, next = reader.scan(document);
      if (previous && next.status !== 'unsafe' && next.status !== 'unsupported' && next.lesson?.key && next.lesson.key !== previous.lesson?.key) {
        if (next.status === 'verified' && contentChanged(previous,next)) { c.bind(next); c.startNext(); message = '已重新识别新小节'; return; }
        pendingContext = { previous, courseKey: next.courseKey, lessonKey: next.lesson.key, until: now()+10000 };
        message = '目录已改变，等待新小节内容独立确认'; arm(); return;
      }
      halt('任务已失效或导航未确认：请明确重扫');
    } });
  c = session.coordinator;
  const port = createNativeNavigation(document, reader, () => c.snapshot().inventory);
  function halt(reason, persist = true) {
    stopped = true; c.stop(); message = reason; log.add('stop');
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
    if (pendingContext) {
      const next = reader.scan(document);
      if (next.status === 'unsafe' || next.status === 'unsupported' || next.courseKey !== pendingContext.courseKey || next.lesson?.key !== pendingContext.lessonKey) {
        pendingContext = null; halt('新小节归属不稳定，请手动重扫'); return;
      }
      if (next.status === 'verified' && contentChanged(pendingContext.previous,next)) {
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
      if (next.status === 'unsafe' || next.status === 'unsupported') { halt('页面验证或任务归属不明确：需人工处理'); return; }
      const different = next.courseKey && next.lesson?.key && (next.courseKey !== snapshot.courseKey || next.lesson.key !== snapshot.lesson?.key);
      if (different) { c.contextChanged(); return; }
      if (next.status === 'verified' && snapshot.status === 'loading' && !state.active) {
        loadingSince = now(); c.bind(next); message = '已重新识别当前小节'; c.startNext(); return;
      }
      // Same-lesson replacement cannot resurrect local-ended evidence or replay automatically.
      if (snapshot.status === 'verified') { halt('当前任务结构改变：已取消旧任务，请手动重扫'); return; }
      if (now() - loadingSince >= 10000) { halt('初始化超时：请手动重扫'); return; }
      message = '等待页面或播放器加载'; panel?.render(); return;
    }
    if (prefs.resting()) message = '周期休息中';
    else {
      const decision = settings().navigation && !state.active ? c.navigationDecision(fresh.assessment === 'optional' ? 'assessment' : state.records.some(r => r.state === 'WAITING_PLATFORM') ? 'completed' : 'prior-credit') : null;
      if (decision?.allowed) {
        c.queueNavigation(decision.permit, port, { delay: sampleDelay(settings(),random), refresh: true }); log.add('navigation'); message = '等待已验证导航';
      } else if (!state.active && !state.records.some(r => ['FAILED','UNRESOLVED','UNSUPPORTED','PAUSED','CANCELLED'].includes(r.state))) c.startNext();
      const current = c.snapshot();
      message = current.records.some(r => r.kind === 'live' && r.state === 'RUNNING') ? '直播入口需真实手动操作；结果未验证' :
        current.records.some(r => ['FAILED','UNRESOLVED','UNSUPPORTED'].includes(r.state)) ? '失败或不支持：需人工处理' :
        current.active ? '执行或延迟等待中' : '等待平台信用或人工操作';
    }
    const after = c.snapshot(), nextSignature = after.records.map(r => r.state).join('|') + fresh.lesson?.credit.status + after.diagnostic;
    if (nextSignature !== signature) {
      signature = nextSignature;
      const task = after.records.find(r => ['READY','STARTING','RUNNING','UNRESOLVED','UNSUPPORTED'].includes(r.state));
      log.add(fresh.lesson?.credit.status === 'confirmed' ? 'credit' : after.diagnostic === 'recovering-media' ? 'recovery' :
        ['FAILED','UNRESOLVED'].includes(task?.state) ? 'outcome' : task?.kind === 'live' || task?.state === 'UNSUPPORTED' ? 'manual' : 'selection',task?.state,task?.kind);
    }
    panel?.render();
  }
  function run() {
    if (disposed || prefs.snapshot().error) { message = '本地存储异常：先恢复默认，再明确恢复'; panel?.render(); return false; }
    if (!settings().automation) { message = '主自动化已关闭'; panel?.render(); return false; }
    const snapshot = reader.scan(document);
    if (snapshot.status !== 'verified') { halt('页面未就绪或存在安全边界，请稍后明确重扫'); return false; }
    prefs.resume(); stopped = false; pendingContext = null; loadingSince = now(); c.bind(snapshot); c.resume(); c.startNext(); panel?.render(); return true;
  }
  app = Object.freeze({ start: run, resume: run, rescan: run, stop: () => halt('已明确停止；重载不会自动恢复'),
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
        state.inventory?.tasks.findLast(t => state.records.some(r => r.key === t.key && r.state === 'WAITING_PLATFORM'));
      return Object.freeze({ settings: settings(), message, task: task ? { kind: task.kind, ordinal: task.ordinal } : null, total: state.records.length,
        taskState: state.records.find(r => r.key === task?.key)?.state,
        localDone: state.records.some(r => r.key === task?.key && r.state === 'WAITING_PLATFORM'), platformConfirmed: state.inventory ? inspectInventory(state.inventory).lesson?.credit.status === 'confirmed' : false,
        delayed: c.actions().some(a => a.status === 'pending' && (a.key.includes(':start:') || a.key.endsWith(':navigate'))), restRemaining: Math.max(0,prefs.snapshot().restUntil-now()) });
    },
    dispose() { if (disposed) return; disposed = true; session.dispose(); panel?.destroy(); if (window[singleton] === app) delete window[singleton]; if (window.XXT === app) delete window.XXT; }
  });
  window[singleton] = app; window.XXT = app;
  if (ui && document.body) panel = mountPanel(document, app);
  if (stopped || !settings().automation) { stopped = true; c.stop(); if (prefs.snapshot().error) log.add('storage'); message = prefs.snapshot().error ? '本地存储异常：已安全停止' : '已保留停止状态，请明确恢复'; }
  else {
    const snapshot = reader.scan(document); c.bind(snapshot);
    if (snapshot.status === 'verified') c.startNext();
    else if (snapshot.status !== 'loading') halt('页面归属或验证状态不明确：需人工处理');
  }
  panel?.render(); return app;
}
