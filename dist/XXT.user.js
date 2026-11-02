// ==UserScript==
// @name XXT — DEVELOPMENT TEST BUILD
// @namespace https://github.com/RXY712200/XXT
// @version 0.1.0
// @description Development test build; unsupported readers/live tasks remain manual. No authenticated compatibility claim.
// @match https://*.chaoxing.com/mycourse/studentstudy*
// @match https://*.chaoxing.com/mooc2-ans/mycourse/studentstudy*
// @grant none
// @run-at document-idle
// @noframes
// ==/UserScript==
(function(){
'use strict';
const __modules={
"src/entry.js": function(__exports, __require) {
const { bootstrap } = __require("src/runtime/browser.js");
if (typeof window !== 'undefined' && window.document) bootstrap(window.document);

Object.assign(__exports, {});
},
"src/runtime/browser.js": function(__exports, __require) {
const { createInventoryReader, inspectInventory } = __require("src/platform/inventory.js");
const { acquireSession } = __require("src/runtime/session.js");
const { createVideoAdapter } = __require("src/adapters/video.js");
const { createAudioAdapter } = __require("src/adapters/audio.js");
const { createDocumentAdapter } = __require("src/adapters/document.js");
const { createLiveAdapter } = __require("src/adapters/live.js");
const { createNativeNavigation } = __require("src/runtime/native-navigation.js");
const { createPreferences, sampleDelay } = __require("src/runtime/preferences.js");
const { createDiagnostics } = __require("src/runtime/diagnostics.js");
const { mountPanel } = __require("src/ui/panel.js");
const { evaluateCompletion } = __require("src/core/completion.js");
const { objectiveVideoTab, activateObjectiveTab } = __require("src/runtime/native-tabs.js");
const singleton = Symbol.for('XXT.browser.runtime.v1');
function bootstrap(document, { clock, random = Math.random, storage, ui = true } = {}) {
  const window = document.defaultView;
  if (window[singleton]) return window[singleton];
  const url = new URL(document.URL);
  if (url.protocol !== 'https:' || !/(^|\.)chaoxing\.com$/.test(url.hostname) || !/^\/(?:mooc2-ans\/)?mycourse\/studentstudy\/?$/.test(url.pathname)) return null;
  const now = clock?.now || (() => Date.now()), reader = createInventoryReader(), log = createDiagnostics();
  let safeStorage; try { safeStorage = storage || window.localStorage; } catch { safeStorage = { getItem() { throw Error('denied'); } }; }
  const prefs = createPreferences(safeStorage, now);
  let panel, app, c, stopped = prefs.snapshot().stopped || Boolean(prefs.snapshot().error), message = '等待识别', loadingSince = now(), disposed = false, signature = '', pendingContext = null, tabPending = null;
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
    if (tabPending) {
      const next = reader.scan(document), title = document.querySelector('.prev_title');
      if (next.courseKey !== tabPending.courseKey || next.lesson?.key !== tabPending.lessonKey || next.status === 'unsafe') { tabPending = null; halt('页签归属变化：请手动重扫'); return; }
      if (next.status === 'verified' && contentChanged(tabPending.previous,next) && /^(?:\d+\s*)?视频$/.test((title?.getAttribute('title') || title?.textContent || '').trim())) {
        tabPending = null; c.bind(next); c.startNext(); return;
      }
      if (now() >= tabPending.until) { tabPending = null; halt('原生视频页签加载超时，请手动重扫'); return; }
      message = '等待原生视频页签内容（不是完成）'; panel?.render(); return;
    }
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
    prefs.resume(); stopped = false; pendingContext = null; tabPending = null; loadingSince = now(); c.bind(snapshot); c.resume(); c.startNext(); panel?.render(); return true;
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
      return Object.freeze({ settings: settings(), message, task: task ? { kind: task.recognition?.kind || task.kind, ordinal: task.ordinal, recognitionOnly: Boolean(task.recognition) } : null, total: state.records.length,
        taskState: state.records.find(r => r.key === task?.key)?.state,
        localDone: Boolean(state.inventory && inspectInventory(state.inventory).valid && state.records.some(r => r.key === task?.key && r.state === 'WAITING_PLATFORM')), platformConfirmed: state.inventory ? evaluateCompletion(state.inventory).lessonConfirmed : false,
        delayed: c.actions().some(a => a.status === 'pending' && (a.key.includes(':start:') || a.key.endsWith(':navigate'))), restRemaining: Math.max(0,prefs.snapshot().restUntil-now()) });
    },
    dispose() { if (disposed) return; disposed = true; document.removeEventListener('click',manualTab,true); session.dispose(); panel?.destroy(); if (window[singleton] === app) delete window[singleton]; if (window.XXT === app) delete window.XXT; }
  });
  function manualTab(event) {
    if (!event.isTrusted || stopped || tabPending || !event.target.closest?.('.prev_white') || !/^(?:\d+\s*)?视频$/.test(event.target.closest('.prev_white').textContent.trim())) return;
    const inventory = c.snapshot().inventory; if (!inventory?.lesson?.key) return;
    if (/^(?:\d+\s*)?视频$/.test((document.querySelector('.prev_title')?.getAttribute('title') || '').trim())) return;
    tabPending = { previous: inventory, courseKey: inventory.courseKey, lessonKey: inventory.lesson.key, until: now()+10000 };
    stopped = true; c.contextChanged(); stopped = false; arm();
  }
  document.addEventListener('click',manualTab,true);
  window[singleton] = app; window.XXT = app;
  if (ui && document.body) panel = mountPanel(document, app);
  if (stopped || !settings().automation) { stopped = true; c.stop(); if (prefs.snapshot().error) log.add('storage'); message = prefs.snapshot().error ? '本地存储异常：已安全停止' : '已保留停止状态，请明确恢复'; }
  else {
    const snapshot = reader.scan(document); c.bind(snapshot);
    const tab = objectiveVideoTab(document);
    if (tab && snapshot.courseKey && snapshot.lesson?.key && !snapshot.tasks.length && snapshot.status === 'loading' && snapshot.hazards.every(code => code.startsWith('loading-'))) {
      tabPending = { previous: snapshot, courseKey: snapshot.courseKey, lessonKey: snapshot.lesson.key, until: now()+10000 };
      if (!activateObjectiveTab(document,tab)) { tabPending = null; halt('视频页签无法安全激活'); }
    } else if (snapshot.status === 'verified') c.startNext();
    else if (snapshot.status !== 'loading') halt('页面归属或验证状态不明确：需人工处理');
  }
  panel?.render(); return app;
}

Object.assign(__exports, {bootstrap});
},
"src/platform/inventory.js": function(__exports, __require) {
const { Credit, evidence, identity } = __require("src/core/contracts.js");
const { captureMediaSource, matchesMediaSource } = __require("src/platform/media-source.js");
const { recognizeSpecial } = __require("src/platform/special.js");
const inventories = new WeakMap();
const optionalTitles = new Set(['章节测验', '章节测试', '本章自测']);
const all = (node, selector) => [...node.querySelectorAll(selector)];
const owned = (node, selector, boundary) => all(node, selector).filter(el => el.closest(boundary) === node);
const text = node => (node?.getAttribute('title') || node?.textContent || '').trim();
const preview = el => ['auditionAudio', 'audio1_html5_white'].includes(el.id) && el.paused && !el.seeking && !el.autoplay;
const active = el => (!el.paused && !el.ended) || el.seeking;
const source = el => {
  const value = el.currentSrc || el.getAttribute('src') || '';
  try { return value ? new URL(value, el.baseURI).href : ''; } catch { return value; }
};

function keyOf(node, within) {
  const value = node.getAttribute('data-id') || node.id;
  if (!value) return null;
  const matches = all(within, '.posCatalog_select').filter(el => (el.getAttribute('data-id') || el.id) === value);
  if (matches.length !== 1 || (node.id && all(node.ownerDocument, '[id]').filter(el => el.id === node.id).length !== 1)) return null;
  return value;
}

function credit(node, subject, scope, boundary) {
  const inScope = el => scope !== 'lesson' || !el.closest('.ans-attach-online, .ans-attach-ct');
  const markers = owned(node, scope === 'lesson' ? '.icon_Completed' : '.ans-job-icon', boundary).filter(inScope);
  const positive = markers.some(el => el.classList.contains('icon_Completed') || el.classList.contains('ans-job-finished')) ||
    (scope === 'task' && node.classList.contains('ans-job-finished'));
  const counts = owned(node, '.jobUnfinishCount', boundary).filter(inScope).map(el => String(el.value ?? el.textContent).trim());
  const negative = counts.some(value => /^\d+$/.test(value) && Number(value) > 0);
  const invalid = counts.some(value => !/^\d+$/.test(value));
  const status = invalid || (positive && negative) ? Credit.CONTRADICTORY : positive ? Credit.CONFIRMED : negative ? Credit.INCOMPLETE : Credit.UNKNOWN;
  return evidence(subject, scope, status, invalid ? 'invalid-counter' : positive && negative ? 'conflicting-markers' : positive ? 'owned-completed-marker' : negative ? 'owned-unfinished-counter' : 'no-positive-marker');
}

function hazardsIn(doc) {
  return all(doc, 'input[type="password"], input[autocomplete="one-time-code"]').length > 0 || all(doc, 'form').some(form =>
    form.querySelector('input, button, select') && /captcha|验证码|身份验证|人脸/i.test(form.textContent + all(form, 'input').map(el => el.name + el.id + el.getAttribute('aria-label')).join(' ')));
}

function read(document) {
  const hazards = [], documents = [], structure = [], tasks = [], mediaPaths = new Map();
  let url;
  try { url = new URL(document.URL); } catch { return { status: 'unsupported', hazards: ['unsupported-url'], tasks, catalog: [], chapters: [], documents, structure }; }
  const supported = url.protocol === 'https:' && /(^|\.)chaoxing\.com$/.test(url.hostname) &&
    /^\/(?:mooc2-ans\/)?mycourse\/studentstudy\/?$/.test(url.pathname);
  const courseValues = [...url.searchParams.getAll('courseId'), ...url.searchParams.getAll('courseid')];
  const courseId = courseValues.length === 1 && courseValues[0] ? courseValues[0] : null;
  const classValues = [...url.searchParams.getAll('clazzid'), ...url.searchParams.getAll('classId')];
  const courseKey = courseId && classValues.length <= 1 ? identity(['course', courseId, classValues[0] || 'no-class-context']) : null;
  if (!supported) hazards.push('unsupported-page');
  if (!courseKey) hazards.push('ambiguous-course');
  if (hazardsIn(document)) hazards.push('verification-required');
  const trees = all(document, '#coursetree'), tree = trees.length === 1 ? trees[0] : null;
  if (!tree) hazards.push(trees.length ? 'ambiguous-catalog' : 'loading-catalog');
  const entries = tree ? all(tree, '.posCatalog_select') : [];
  const isGroup = el => el.classList.contains('firstLayer') || all(el.closest('li') || el, '.posCatalog_select').some(other => other !== el);
  const groups = entries.filter(isGroup);
  const chapters = groups.map(node => Object.freeze({ key: keyOf(node, tree), node, title: text(owned(node, '.posCatalog_name', '.posCatalog_select')[0]) }));
  if (chapters.some(item => !item.key) || new Set(chapters.map(item => item.key)).size !== chapters.length) hazards.push('ambiguous-chapter-identity');
  const catalog = entries.filter(node => !isGroup(node)).map((node, ordinal) => {
    const labels = owned(node, '.posCatalog_name', '.posCatalog_select');
    const ancestors = [];
    for (let li = node.closest('li')?.parentElement?.closest('li'); li && tree.contains(li); li = li.parentElement?.closest('li')) {
      const group = groups.find(el => el.closest('li') === li); if (group) ancestors.unshift(keyOf(group, tree));
    }
    const id = keyOf(node, tree), key = id && courseKey ? identity([courseKey, 'lesson', id]) : null;
    return Object.freeze({ key, id, node, ordinal, title: labels.length === 1 ? text(labels[0]) : '',
      chapterKey: ancestors[0] || null, ancestry: Object.freeze(ancestors),
      optionalAssessment: labels.length === 1 && optionalTitles.has(text(labels[0])),
      assessmentLike: labels.length === 1 && /考试|测验|测试|自测|作业/.test(text(labels[0])),
      restricted: node.getAttribute('aria-disabled') === 'true' || node.hasAttribute('disabled') || /未开放|锁定/.test(text(labels[0])),
      credit: credit(node, key, 'lesson', '.posCatalog_select') });
  });
  if (catalog.some(item => !item.key || !item.title)) hazards.push('ambiguous-lesson-identity');
  const current = catalog.filter(item => item.node.classList.contains('posCatalog_active'));
  const lesson = current.length === 1 ? current[0] : null;
  if (!lesson) hazards.push(current.length ? 'ambiguous-active-lesson' : 'loading-active-lesson');
  const steps = all(document, '.prev_title');
  const stepTitle = steps.length === 1 ? text(steps[0]) : '';
  const assessment = lesson?.optionalAssessment && stepTitle === lesson.title ? 'optional' :
    /考试|测验|测试|自测|作业/.test(stepTitle) ? 'mandatory-or-unclear' : null;
  if (assessment === 'mandatory-or-unclear') hazards.push('mandatory-assessment');
  const frames = all(document, 'iframe[info="card"], iframe[src*="/knowledge/cards"]');
  const frame = frames.length === 1 ? frames[0] : null;
  if (!frame) hazards.push(frames.length ? 'ambiguous-content-frame' : 'loading-content-frame');
  let root;
  try { root = frame?.contentDocument; } catch { /* Read-only origin boundary. */ }
  if (frame && !root) hazards.push('inaccessible-content');
  const seen = new Set();
  const kinds = [['video', 'ans-insertvideo-online'], ['audio', 'ans-insertaudio'], ['document', 'insertdoc-online-pdf']];
  function inspect(doc, path, media = []) {
    if (!doc || seen.has(doc) || path.length > 8) { hazards.push('ambiguous-frame-tree'); return media; }
    seen.add(doc); documents.push(doc); structure.push(doc, doc.documentElement);
    if (!doc.body) hazards.push('loading-document');
    if (hazardsIn(doc)) hazards.push('verification-required');
    for (const child of doc.body?.children || []) visit(child, path, media);
    return media;
  }
  function add(owner, kind, path, media, metadata = {}) {
    const ordinal = tasks.length, contentId = metadata.objectid || metadata.jobid || owner.id || null;
    const ownerId = owner.id || metadata.jobid || metadata.objectid || null;
    const key = contentId && ownerId && lesson?.key ? identity([lesson.key, kind, String(contentId), String(ownerId)]) : null;
    let wrapper = owner.closest('.ans-attach-ct');
    const unambiguousWrapper = wrapper && all(wrapper, '.ans-attach-online').length === 1 && all(wrapper, '.ans-job-icon').length === 1;
    const observed = unambiguousWrapper ? credit(wrapper, key, 'task', '.ans-attach-ct') : evidence(key, 'task', Credit.UNKNOWN, wrapper ? 'ambiguous-credit-owner' : 'no-task-marker');
    const primary = media.filter(el => el.tagName.toLowerCase() === kind && !preview(el));
    if (['video','audio'].includes(kind) && primary.length > 1) hazards.push('ambiguous-primary-player');
    if (primary.some(el => el.error)) hazards.push('primary-media-error');
    if (media.some(el => !primary.includes(el) && !preview(el) && el.controls && !el.hidden && el.style.display !== 'none')) hazards.push('independent-media-controls');
    if (media.some(el => active(el) && !primary.includes(el))) hazards.push('competing-media');
    if (media.filter(active).length > 1) hazards.push('competing-media');
    const resolution = ['video','audio'].includes(kind) && !primary.length ? 'loading' : 'recognized';
    if (resolution === 'loading') hazards.push('loading-player');
    tasks.push(Object.freeze({ key, ownerKey: ownerId ? String(ownerId) : null, identity: key ? 'verified' : 'ambiguous',
      lessonKey: lesson?.key || null, ordinal, kind, owner, path: Object.freeze([...(primary.length === 1 ? mediaPaths.get(primary[0]) || path : path)]), player: primary.length === 1 ? primary[0] : null,
      source: primary.length === 1 ? source(primary[0]) : null,
      declaredSource: primary.length === 1 ? primary[0].getAttribute('src') : null,
      mediaSource: primary.length === 1 ? captureMediaSource(primary[0]) : null,
      recognition: kind === 'unknown' ? recognizeSpecial(owner,metadata) : null,
      resolution, capability: kind === 'unknown' || kind === 'assessment' ? 'unsupported' : 'adapter-required', executable: false,
      evidence: Object.freeze([evidence(key, 'recognition', Credit.UNKNOWN, kind === 'unknown' ? 'independent-unknown-boundary' : 'native-structure')]), credit: observed }));
    structure.push(owner, owner.className, owner.id, owner.getAttribute('data'), owner.getAttribute('src'), key);
    if (kind === 'live') structure.push(owner.getAttribute('href'), owner.textContent);
    for (const el of media) {
      structure.push(el, el.getAttribute('src'));
      for (const node of el.children) if (node.tagName === 'SOURCE') structure.push(node, node.getAttribute('src'), node.getAttribute('type'), node.getAttribute('media'));
    }
  }
  function visit(el, path, media) {
    if (el.matches('.ans-attach-online') && !path.some(node => node.matches?.('.ans-attach-online'))) {
      const matches = kinds.filter(([, cls]) => el.classList.contains(cls));
      let metadata = {};
      try {
        metadata = JSON.parse(el.getAttribute('data') || '{}');
        if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata) ||
          ['objectid','jobid'].some(key => key in metadata && (typeof metadata[key] !== 'string' || !metadata[key].trim()))) throw new Error('Invalid identity metadata');
      } catch { metadata = {}; hazards.push('invalid-task-metadata'); }
      const kind = matches.length === 1 ? matches[0][0] : 'unknown';
      const innerMedia = [];
      if (el.tagName === 'IFRAME') {
        let inner; try { inner = el.contentDocument; } catch { /* No access is not absence. */ }
        if (!inner) hazards.push('inaccessible-content'); else inspect(inner, [...path, el], innerMedia);
      } else for (const child of el.children) visit(child, [...path, el], innerMedia);
      add(el, kind, [...path, el], innerMedia, metadata); return;
    }
    if (el.matches('.ans-attach-online')) hazards.push('nested-independent-boundary');
    if (el.matches('a.liveHref') && !path.some(node => node.matches?.('.ans-attach-online'))) {
      if (!el.querySelector('.liveCard .live-ct')) { hazards.push('ambiguous-live-entry'); return; }
      add(el, 'live', [...path, el], []); return;
    }
    if (el.tagName === 'IFRAME') {
      structure.push(el, el.getAttribute('src'));
      let inner; try { inner = el.contentDocument; } catch { /* Keep required unreadability explicit. */ }
      if (!inner) hazards.push('inaccessible-content'); else inspect(inner, [...path, el], media);
    } else {
      if (el.matches('video,audio')) { media.push(el); mediaPaths.set(el, [...path]); }
      for (const child of el.children) visit(child, path, media);
    }
  }
  if (root) {
    const unclaimed = inspect(root, [frame]);
    const primaries = unclaimed.filter(el => !preview(el) && (el.matches('video[id*="video_html5"],audio#audio_html5_api') || active(el) || (el.controls && !el.hidden && el.style.display !== 'none')));
    for (const el of primaries) add(el, el.matches('video[id*="video_html5"],audio#audio_html5_api') ? el.tagName.toLowerCase() : 'unknown', mediaPaths.get(el), [el]);
    if (unclaimed.some(el => preview(el) === false && active(el) && !primaries.includes(el))) hazards.push('competing-media');
    if (unclaimed.some(el => ['auditionAudio','audio1_html5_white'].includes(el.id) && active(el))) hazards.push('competing-media');
  }
  if (documents.flatMap(doc => all(doc, 'video,audio')).filter(active).length > 1) hazards.push('competing-media');
  if (assessment) add(lesson?.node || frame || document.documentElement, 'assessment', frame ? [frame] : [], []);
  if (tasks.some(task => !task.key) || new Set(tasks.map(task => task.key)).size !== tasks.length) hazards.push('ambiguous-task-identity');
  if (!tasks.length && lesson?.credit.status !== Credit.CONFIRMED) hazards.push('loading-tasks');
  structure.push(document.URL, tree, frame, root, lesson?.node, stepTitle);
  for (const chapter of chapters) structure.push(chapter.node, chapter.key, chapter.title);
  for (const item of catalog) structure.push(item.node, item.key, item.title, item.chapterKey, ...item.ancestry, item.restricted);
  const unique = [...new Set(hazards)];
  const status = unique.some(reason => !reason.startsWith('loading-')) ? 'unsafe' : unique.length ? 'loading' : 'verified';
  return { status, pageURL: document.URL, observedAt: Date.now(), hazards: Object.freeze(unique), supported, courseKey, lesson, assessment, catalog: Object.freeze(catalog),
    chapters: Object.freeze(chapters), tasks: Object.freeze(tasks), documents: Object.freeze(documents), structure };
}

/** Create an explicit read-only reader. Importing this module installs nothing. */
function createInventoryReader() {
  let revision = 0;
  return Object.freeze({ scan(document) {
    const initial = read(document), snapshot = Object.freeze({ ...initial, structure: undefined, revision: ++revision });
    const sources = initial.documents.flatMap(doc => all(doc, 'video,audio')).map(media => [media, captureMediaSource(media)]);
    inventories.set(snapshot, () => {
      const fresh = read(document);
      const same = fresh.structure.length === initial.structure.length && fresh.structure.every((value,i) => value === initial.structure[i]);
      return Object.freeze({ valid: same && sources.every(([media, expected]) => matchesMediaSource(expected, media)) && fresh.status === 'verified', revision: snapshot.revision, ...fresh, structure: undefined });
    });
    return snapshot;
  } });
}

/** Always reread scoped DOM evidence; reject caller-created inventory objects. */
function inspectInventory(inventory) {
  const inspect = inventories.get(inventory);
  if (!inspect) throw new TypeError('Inventory must come from the platform reader');
  return inspect();
}

Object.assign(__exports, {createInventoryReader,inspectInventory});
},
"src/core/contracts.js": function(__exports, __require) {
/** Local execution and observed platform credit are deliberately independent. */
const Credit = Object.freeze({ UNKNOWN: 'unknown', CONFIRMED: 'confirmed', INCOMPLETE: 'incomplete', CONTRADICTORY: 'contradictory' });

function identity(parts) {
  return parts.every(part => typeof part === 'string' && part.length > 0) ? JSON.stringify(parts) : null;
}

function evidence(subject, scope, status, reason) {
  return Object.freeze({ subject, scope, status, reason, provenance: 'observed-dom' });
}

const State = Object.freeze(Object.fromEntries([
  'DISCOVERED', 'PENDING', 'READY', 'STARTING', 'RUNNING', 'LOCAL_COMPLETED',
  'WAITING_PLATFORM', 'FAILED', 'UNRESOLVED', 'UNSUPPORTED', 'PAUSED', 'CANCELLED'
].map(name => [name, name])));

const transitions = {
  DISCOVERED: ['PENDING'], PENDING: ['READY', 'UNSUPPORTED'], READY: ['STARTING'],
  STARTING: ['RUNNING', 'FAILED'], RUNNING: ['LOCAL_COMPLETED', 'FAILED'],
  LOCAL_COMPLETED: ['WAITING_PLATFORM'], FAILED: ['UNRESOLVED'], PAUSED: ['PENDING']
};
function transition(record, next) {
  if (!Object.values(State).includes(next) ||
    !(transitions[record.state]?.includes(next) ||
      (['PAUSED', 'CANCELLED'].includes(next) && !['CANCELLED', 'PAUSED'].includes(record.state)))) {
    throw new Error(`Illegal task transition: ${record.state} -> ${next}`);
  }
  record.state = next;
  record.history.push(next);
}

Object.assign(__exports, {Credit,identity,evidence,State,transition});
},
"src/platform/media-source.js": function(__exports, __require) {
/** A source declaration is identity evidence, not proof that decoding will succeed. */
function url(value, base) {
  if (!value?.trim()) return null;
  try {
    const parsed = new URL(value, base);
    return ['https:', 'http:', 'blob:'].includes(parsed.protocol) ||
      parsed.protocol === 'data:' && /^data:(audio|video)\//i.test(value) ? parsed.href : null;
  } catch { return null; }
}

function captureMediaSource(media) {
  const attribute = media.getAttribute('src');
  const children = [...media.children].filter(node => node.tagName === 'SOURCE').map(node =>
    Object.freeze({ node, src: node.getAttribute('src'), type: node.getAttribute('type'), media: node.getAttribute('media') }));
  const declarations = attribute?.trim() ? [url(attribute, media.baseURI)] : children.map(item => url(item.src, media.baseURI));
  const rawCurrent = media.currentSrc || '', current = url(rawCurrent, media.baseURI);
  const urls = [...new Set(declarations)];
  const declared = declarations.length > 0;
  const object = media.srcObject || null;
  const usable = !object && !(rawCurrent && !current) &&
    (declared ? urls.length === 1 && Boolean(urls[0]) && (!current || current === urls[0]) : Boolean(current));
  return Object.freeze({ attribute, base: media.baseURI, children: Object.freeze(children),
    selected: current, object, identity: usable ? (declared ? urls[0] : current) : null, usable });
}

/** Permit only initial selection of the same declared URL, never a different source. */
function matchesMediaSource(expected, media) {
  const fresh = captureMediaSource(media);
  return fresh.attribute === expected.attribute && fresh.base === expected.base && fresh.object === expected.object &&
    fresh.children.length === expected.children.length && fresh.children.every((item, i) => {
      const old = expected.children[i];
      return item.node === old.node && item.src === old.src && item.type === old.type && item.media === old.media;
    }) && fresh.identity === expected.identity && fresh.usable === expected.usable &&
    (expected.selected ? fresh.selected === expected.selected : !fresh.selected || fresh.selected === expected.identity);
}

Object.assign(__exports, {captureMediaSource,matchesMediaSource});
},
"src/platform/special.js": function(__exports, __require) {
// Evidence: pinned reference's published structural recognition. Never execution.
function recognizeSpecial(owner, metadata = {}) {
  if (!owner.isConnected || owner.tagName !== 'IFRAME') return null;
  let doc, route; try { doc = owner.contentDocument; route = new URL(doc.URL); } catch { return null; }
  const book = route.protocol === 'https:' && /(^|\.)chaoxing\.com$/.test(route.hostname) && /^\/readsvr\/book\/mooc(?:\/|$)/.test(route.pathname);
  const module = metadata.module || metadata.type, matches = [];
  if (book && doc.querySelector('#reader .readerPager') && doc.querySelector('#pagejump')) {
    const seconds = Number(route.searchParams.get('timing')); if (Number.isSafeInteger(seconds) && seconds > 0 && seconds <= 86400) matches.push('timed-reader');
  } else if (book && module === 'insertbook' && doc.querySelector('#ReadWeb')) matches.push('book-knowledge-map');
  if (doc.querySelector('.swiper-container .swiper-slide') && doc.querySelector('audio')) matches.push('audio-slides');
  if (doc.querySelector('#hyperlink')) matches.push('hyperlink');
  if (module === 'insertflash') matches.push('legacy-multimedia');
  return matches.length === 1 ? Object.freeze({ kind: matches[0], executable: false, reason: `recognition-only-${matches[0]}` }) : null;
}

Object.assign(__exports, {recognizeSpecial});
},
"src/runtime/session.js": function(__exports, __require) {
const { createCoordinator } = __require("src/core/coordinator.js");
// Explicit assembly only: no browser boot, listeners, clicks or media adapters.
const sessions = new WeakMap();
function acquireSession(document, options) {
  if (!document?.documentElement) throw new TypeError('An owned document is required');
  if (sessions.has(document)) return sessions.get(document);
  const coordinator = createCoordinator(options);
  const session = Object.freeze({ coordinator, dispose() {
    coordinator.destroy(); if (sessions.get(document) === session) sessions.delete(document);
  } });
  sessions.set(document, session); return session;
}

Object.assign(__exports, {acquireSession});
},
"src/core/coordinator.js": function(__exports, __require) {
const { State, transition } = __require("src/core/contracts.js");
const { evaluateCompletion } = __require("src/core/completion.js");
const { createScheduler } = __require("src/core/scheduler.js");
const { createNavigationGate } = __require("src/core/navigation.js");
const { inspectInventory } = __require("src/platform/inventory.js");
const { matchesMediaSource } = __require("src/platform/media-source.js");
/** No real adapters or browser effects are installed here. Ports must be explicit. */
function createCoordinator({ clock, adapters = {}, delayFor = () => 0, continueKnownAfterFailure = false, autoContinue = false,
  canStart = () => true, onLocalResult = () => {}, onBound = () => {}, onInvalidated = () => {} } = {}) {
  const scheduler = createScheduler(clock);
  const now = clock?.now || (() => Date.now());
  let inventory = null, records = [], generation = 0, stopped = false, destroyed = false;
  let active = null, navigation = null, diagnostic = 'no-inventory';
  const view = () => Object.freeze({ inventory, generation, stopped: stopped || destroyed,
    active: Boolean(active || navigation), diagnostic,
    records: Object.freeze(records.map(({ task, ...record }) => Object.freeze({ ...record, history: Object.freeze([...record.history]) }))) });
  const gate = createNavigationGate({ now, context: view });

  function invalidate(reason, pause = false) {
    generation++; scheduler.cancelAll();
    const previous = active; active = null;
    previous?.abort.abort();
    try { previous?.handle?.cancel?.(); } catch { /* Cancellation cannot revive work. */ }
    navigation?.abort.abort(); navigation = null;
    for (const record of records) if (![State.CANCELLED, State.PAUSED].includes(record.state)) transition(record, pause ? State.PAUSED : State.CANCELLED);
    diagnostic = reason;
    onInvalidated(reason);
  }
  function bind(next) {
    if (destroyed) return false;
    inspectInventory(next); // Reject forged snapshots before replacing an owned context.
    invalidate('inventory-replaced'); inventory = next;
    records = next.tasks.map(task => {
      const record = { task, key: task.key, kind: task.kind, state: State.DISCOVERED, history: [State.DISCOVERED] };
      transition(record, State.PENDING); return record;
    });
    diagnostic = stopped ? 'explicitly-stopped' : next.status;
    onBound(next);
    return next.status === 'verified';
  }
  function valid() {
    return !destroyed && !stopped && inventory && inspectInventory(inventory).valid;
  }
  function tokenValid(token) { return active === token && token.generation === generation && valid(); }
  function release(token) {
    active = null; token.abort.abort();
    try { token.handle?.cancel?.(); } catch { /* A finished effect cannot hold the queue. */ }
  }
  function fail(token, reason) {
    if (!tokenValid(token)) { if (active === token) invalidate('context-invalidated'); return false; }
    if (![State.STARTING, State.RUNNING].includes(token.record.state)) return false;
    transition(token.record, State.FAILED); transition(token.record, State.UNRESOLVED);
    diagnostic = typeof reason === 'string' ? reason : 'adapter-failed'; release(token); return true;
  }
  function done(token) {
    if (!tokenValid(token)) { if (active === token) invalidate('context-invalidated'); return false; }
    if (token.record.state !== State.RUNNING) return false;
    transition(token.record, State.LOCAL_COMPLETED); transition(token.record, State.WAITING_PLATFORM);
    diagnostic = 'local-ended-not-platform-credit'; release(token);
    try { onLocalResult(token.record.task); } catch { stopped = true; invalidate('result-persistence-failed', true); return false; }
    if (autoContinue) scheduler.request({ key: `${generation}:continue:${token.record.key}`, delay: 0,
      validate: () => generation === token.generation && valid() && !active && !navigation,
      execute: startNext, onInvalid: () => { if (generation === token.generation && !valid()) invalidate('continuation-context-invalid'); } });
    return true;
  }
  function startNext() {
    if (active || navigation || !valid()) {
      if (inventory && !stopped && !destroyed && !inspectInventory(inventory).valid) invalidate('context-invalidated');
      return false;
    }
    const evaluation = evaluateCompletion(inventory);
    if (!evaluation.safe) { invalidate('unsafe-credit-evidence'); return false; }
    // An already credited lesson is a navigation decision, never a replay request.
    if (evaluation.lessonConfirmed) { diagnostic = 'prior-lesson-credit'; return false; }
    let record;
    for (const candidate of records) {
      // Unknown boundaries are not erased even if an unrelated marker is positive.
      if (['unknown', 'assessment'].includes(candidate.kind)) {
        if (candidate.state === State.PENDING) transition(candidate, State.UNSUPPORTED);
        diagnostic = candidate.task.recognition?.reason || 'unsupported-task-boundary'; return false;
      }
      if (evaluation.taskConfirmed.includes(candidate.key) || candidate.state === State.WAITING_PLATFORM) continue;
      if (candidate.state === State.UNRESOLVED && continueKnownAfterFailure) continue;
      if (candidate.state !== State.PENDING) { diagnostic = 'unresolved-task'; return false; }
      record = candidate; break;
    }
    if (!record) { diagnostic = 'waiting-platform-evidence'; return false; }
    if (!canStart(record.task)) { diagnostic = 'start-deferred'; return false; }
    const adapter = adapters[record.kind];
    if (!adapter || typeof adapter.start !== 'function' || adapter.recognize?.(record.task) !== true) {
      transition(record, State.UNSUPPORTED); diagnostic = 'adapter-unavailable'; return false;
    }
    if (evaluation.fresh.documents.some(doc => [...doc.querySelectorAll('video,audio')].some(el =>
      el !== record.task.player && ((!el.paused && !el.ended) || el.seeking)))) {
      diagnostic = 'independently-active-media'; return false;
    }
    const delay = delayFor('task-start', record.task);
    if (!Number.isSafeInteger(delay) || delay < 0) throw new RangeError('Delay policy must return nonnegative integer milliseconds');
    transition(record, State.READY);
    const token = { generation, record, abort: new AbortController(), handle: null };
    active = token;
    scheduler.request({ key: `${generation}:start:${record.key}`, delay,
      validate: () => tokenValid(token) && record.state === State.READY,
      onInvalid: () => { if (active === token) invalidate('context-invalidated'); },
      onError: () => { if (active === token) fail(token, 'adapter-start-rejected'); },
      execute() {
        transition(record, State.STARTING);
        const context = Object.freeze({ task: record.task, generation: token.generation, signal: token.abort.signal,
          done: () => done(token), fail: reason => fail(token, reason),
          isCurrent: () => tokenValid(token), now,
          note(reason) { if (tokenValid(token) && typeof reason === 'string') diagnostic = reason; },
          cancelScheduled(key) { return scheduler.cancel(`${token.generation}:task:${record.key}:${key}`); },
          scheduleRecurring({ key, delay, execute }) {
            if (!tokenValid(token) || record.state !== State.RUNNING) return false;
            return scheduler.recurring({ key: `${token.generation}:task:${record.key}:${key}`, delay,
              validate: () => tokenValid(token) && record.state === State.RUNNING,
              execute, onInvalid: () => { if (active === token) invalidate('context-invalidated'); },
              onError: () => fail(token, 'adapter-action-failed') });
          },
          schedule({ key, delay, execute }) {
            if (!tokenValid(token) || ![State.STARTING, State.RUNNING].includes(record.state)) return false;
            return scheduler.request({ key: `${token.generation}:task:${record.key}:${key}`, delay,
              validate: () => tokenValid(token) && [State.STARTING, State.RUNNING].includes(record.state),
              execute, onInvalid: () => { if (active === token) invalidate('context-invalidated'); },
              onError: () => fail(token, 'adapter-action-failed') });
          } });
        return Promise.resolve(adapter.start(context)).then(handle => {
          if (!tokenValid(token) || record.state !== State.STARTING) {
            try { handle?.cancel?.(); } catch { /* Late start result remains obsolete. */ }
            if (active === token) invalidate('context-invalidated'); return;
          }
          token.handle = handle; transition(record, State.RUNNING); diagnostic = 'running';
          handle?.activate?.(); // Buffered media results may be delivered only after startup succeeds.
        }, () => fail(token, 'adapter-start-rejected'));
      }
    });
    return true;
  }
  function queueNavigation(permit, port, { delay = 0, acknowledgementMs = 3000, refresh = false } = {}) {
    if (navigation || active || !valid() || typeof port?.activate !== 'function' ||
      !Number.isSafeInteger(acknowledgementMs) || acknowledgementMs < 1 || acknowledgementMs > 30000) return false;
    const expectedGeneration = generation, source = inventory;
    return scheduler.request({ key: `${generation}:navigate`, delay,
      validate: () => generation === expectedGeneration && inventory === source && valid() && !active && !navigation,
      onInvalid: () => invalidate('context-invalidated'),
      onError: () => { if (generation === expectedGeneration) invalidate('navigation-effect-failed', true); },
      execute() {
        const selected = refresh ? gate.renew(permit) : permit;
        const authorization = gate.consume(selected);
        if (!authorization) { diagnostic = 'navigation-denied'; return; }
        const token = { abort: new AbortController() }; navigation = token;
        const timeoutKey = `${generation}:navigation-ack`;
        scheduler.request({ key: timeoutKey, delay: acknowledgementMs,
          validate: () => navigation === token && generation === expectedGeneration,
          execute: () => { stopped = true; invalidate('navigation-unacknowledged', true); } });
        return Promise.resolve(port.activate(authorization, { signal: token.abort.signal })).then(next => {
          if (navigation !== token || generation !== expectedGeneration || stopped || destroyed) return;
          const fresh = inspectInventory(next);
          if (!fresh.valid || fresh.courseKey !== authorization.courseKey || fresh.lesson.key !== authorization.targetKey) {
            stopped = true; invalidate('navigation-ack-mismatch', true); return;
          }
          scheduler.cancel(timeoutKey); navigation = null; token.abort.abort(); bind(next); diagnostic = 'navigation-acknowledged';
        });
      }
    });
  }
  // A missing inner player may appear inside an already uniquely owned attachment.
  // Never adopt changed owners, catalogs or lessons while waiting for readiness.
  function waitForMedia(readSnapshot) {
    if (active || navigation || stopped || destroyed || !inventory || inventory.status !== 'loading' ||
      inventory.hazards.some(reason => reason !== 'loading-player') || !inventory.tasks.length) return false;
    const initial = inventory, expected = generation, deadline = now() + 5000;
    let count = 0;
    function check() {
      const next = readSnapshot(), fresh = inspectInventory(next);
      const same = fresh.pageURL === initial.pageURL && fresh.courseKey === initial.courseKey && fresh.lesson?.key === initial.lesson.key &&
        fresh.catalog.length === initial.catalog.length && fresh.catalog.every((item, i) => item.node === initial.catalog[i].node && item.key === initial.catalog[i].key &&
          item.title === initial.catalog[i].title && item.chapterKey === initial.catalog[i].chapterKey && item.restricted === initial.catalog[i].restricted) &&
        initial.documents.every(doc => fresh.documents.includes(doc)) &&
        fresh.tasks.length === initial.tasks.length && fresh.tasks.every((task, i) => {
          const old = initial.tasks[i];
          return task.key === old.key && task.owner === old.owner && task.path.length === old.path.length && task.path.every((node, n) => node === old.path[n]) &&
            (!old.player || task.player === old.player && matchesMediaSource(old.mediaSource, task.player));
        });
      if (!same || fresh.hazards.some(reason => reason !== 'loading-player')) { invalidate('readiness-context-changed'); return; }
      if (fresh.valid) { bind(next); startNext(); return; }
      if (now() >= deadline) { diagnostic = 'media-readiness-timeout'; return; }
      poll();
    }
    function poll() {
      scheduler.request({ key: `${expected}:readiness:${++count}`, delay: Math.min(100, deadline - now()),
        validate: () => generation === expected && !stopped && !destroyed && inventory === initial,
        execute: check, onError: () => invalidate('readiness-failed') });
    }
    if (scheduler.snapshot().some(action => action.key.startsWith(`${expected}:readiness:`))) return false;
    poll(); return true;
  }
  return Object.freeze({ bind, startNext, waitForMedia, snapshot: view, queueNavigation,
    scheduleRuntime({ key, delay, execute }) {
      const expected = generation;
      if (stopped || destroyed) return false;
      return scheduler.recurring({ key: `${generation}:runtime:${key}`, delay,
        validate: () => !stopped && !destroyed && generation === expected,
        execute, onError: () => { stopped = true; invalidate('runtime-error', true); } });
    },
    navigationDecision: mode => gate.issue(mode),
    stop() { if (!destroyed) { stopped = true; invalidate('explicit-stop', true); } },
    contextChanged() { if (!destroyed) invalidate('context-changed'); },
    resume() {
      if (destroyed || !inventory || !inspectInventory(inventory).valid) return false;
      stopped = false; return bind(inventory);
    },
    destroy() { if (!destroyed) { destroyed = true; stopped = true; invalidate('destroyed'); } },
    actions: () => scheduler.snapshot()
  });
}

Object.assign(__exports, {createCoordinator});
},
"src/core/completion.js": function(__exports, __require) {
const { Credit } = __require("src/core/contracts.js");
const { inspectInventory } = __require("src/platform/inventory.js");
/** Local state is deliberately not an input to the platform-credit evaluator. */
function evaluateCompletion(inventory) {
  const fresh = inspectInventory(inventory);
  const reasons = [...fresh.hazards];
  if (!fresh.valid) reasons.push('stale-or-unsafe-inventory');
  const validEvidence = (item, scope) => item?.provenance === 'observed-dom' && item.scope === scope;
  if (!validEvidence(fresh.lesson?.credit, 'lesson') || fresh.lesson.credit.subject !== fresh.lesson.key) reasons.push('unowned-lesson-evidence');
  for (const task of fresh.tasks) {
    if (!validEvidence(task.credit, 'task') || task.credit.subject !== task.key || task.credit.reason === 'ambiguous-credit-owner') reasons.push('ambiguous-task-evidence');
    if (task.credit.status === Credit.CONTRADICTORY) reasons.push('contradictory-task-evidence');
  }
  if (fresh.lesson?.credit.status === Credit.CONTRADICTORY) reasons.push('contradictory-lesson-evidence');
  return Object.freeze({ fresh, safe: reasons.length === 0, reasons: Object.freeze([...new Set(reasons)]),
    lessonConfirmed: reasons.length === 0 && fresh.lesson?.credit.status === Credit.CONFIRMED,
    taskConfirmed: Object.freeze(fresh.tasks.filter(task => task.credit.status === Credit.CONFIRMED).map(task => task.key)) });
}

Object.assign(__exports, {evaluateCompletion});
},
"src/core/scheduler.js": function(__exports, __require) {
/** One logical key is usable once per scheduler lifetime; cancellation is final. */
function createScheduler(clock = {
  now: () => Date.now(), setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: id => globalThis.clearTimeout(id)
}) {
  const actions = new Map();
  function cancel(key) {
    const action = actions.get(key);
    if (!action || !(action.status === 'pending' || action.recurring && action.status === 'executing')) return false;
    action.status = 'cancelled'; clock.clearTimeout(action.timer); return true;
  }
  function enqueue({ key, delay = 0, validate, execute, onInvalid = () => {}, onError = () => {} }, recurring = false) {
    if (typeof key !== 'string' || !key || actions.has(key)) return false;
    if (!Number.isSafeInteger(delay) || delay < 0) throw new RangeError('Delay must be nonnegative integer milliseconds');
    if (recurring && delay === 0) throw new RangeError('Recurring interval must be positive');
    const action = { key, deadline: clock.now() + delay, status: 'pending', recurring, epoch: 0 };
    actions.set(key, action);
    function arm() {
      action.deadline = clock.now() + delay;
      action.status = 'pending';
      const epoch = ++action.epoch;
      action.timer = clock.setTimeout(() => run(epoch), delay);
    }
    function finish() { if (recurring && action.status === 'executing') arm(); }
    function error(reason) { if (action.status !== 'cancelled') { action.status = 'failed'; onError(reason); } }
    function run(epoch) {
      if (action.status !== 'pending' || epoch !== action.epoch) return;
      try {
        if (!validate()) { action.status = 'invalidated'; onInvalid(); return; }
        action.status = recurring ? 'executing' : 'executed';
        const result = execute();
        if (result?.then) Promise.resolve(result).then(finish, error); else finish();
      } catch (reason) { error(reason); }
    }
    arm();
    return true;
  }
  return Object.freeze({
    request: action => enqueue(action),
    recurring: action => enqueue(action, true),
    cancel,
    cancelAll() { for (const key of actions.keys()) cancel(key); },
    snapshot: () => Object.freeze([...actions.values()].map(({ key, deadline, status }) => Object.freeze({ key, deadline, status })))
  });
}

Object.assign(__exports, {createScheduler});
},
"src/core/navigation.js": function(__exports, __require) {
const { Credit, State } = __require("src/core/contracts.js");
const { evaluateCompletion } = __require("src/core/completion.js");
/** Permits are private branded, short-lived, single-use decisions, never clicks. */
function createNavigationGate({ now, context, ttl = 5000 }) {
  if (!Number.isSafeInteger(ttl) || ttl <= 0 || ttl > 30000) throw new RangeError('Invalid permit lifetime');
  const permits = new WeakMap();
  function eligibility(mode) {
    const c = context();
    if (c.stopped || c.active || !c.inventory) return { reason: 'inactive-or-busy-context' };
    const evaluated = evaluateCompletion(c.inventory), f = evaluated.fresh;
    if (!evaluated.safe || f.lesson?.restricted) return { reason: 'unsafe-completion-context' };
    const i = f.catalog.findIndex(item => item.key === f.lesson.key);
    let target;
    if (mode === 'assessment') {
      if (f.assessment !== 'optional' || f.tasks.length !== 1 || f.tasks[0].kind !== 'assessment') return { reason: 'not-isolated-optional-assessment' };
      const preceding = f.catalog.slice(0, i).filter(item => item.chapterKey === f.lesson.chapterKey);
      if (!preceding.length || preceding.some(item => item.optionalAssessment || item.credit.status !== Credit.CONFIRMED)) return { reason: 'unverified-preceding-learning' };
      target = f.catalog[i + 1];
      if (!target || !target.chapterKey || target.chapterKey === f.lesson.chapterKey || target.assessmentLike) return { reason: 'uncertain-next-chapter' };
    } else {
      if (!['completed', 'prior-credit'].includes(mode) || !evaluated.lessonConfirmed || f.assessment) return { reason: 'lesson-not-credited' };
      if (f.tasks.some(task => ['unknown', 'assessment'].includes(task.kind))) return { reason: 'unsupported-boundary' };
      const blocked = c.records.some(record => [State.FAILED, State.UNRESOLVED, State.UNSUPPORTED, State.PAUSED, State.CANCELLED].includes(record.state));
      if (blocked) return { reason: 'unresolved-execution' };
      if (mode === 'completed' && f.tasks.some(task => !evaluated.taskConfirmed.includes(task.key) &&
        !c.records.some(record => record.key === task.key && record.state === State.WAITING_PLATFORM))) return { reason: 'unfinished-local-task' };
      if (f.tasks.some(task => task.credit.status === Credit.INCOMPLETE)) return { reason: 'incomplete-task-evidence' };
      target = f.catalog[i + 1];
    }
    if (!target || target.restricted || !target.key || target.assessmentLike && !target.optionalAssessment) return { reason: 'no-eligible-target' };
    // A currently playing player cannot be abandoned by a pre-credit shortcut.
    if (f.documents.some(doc => [...doc.querySelectorAll('video,audio')].some(el => !el.paused && !el.ended || el.seeking))) return { reason: 'media-still-active' };
    return { c, evaluated, target };
  }
  return Object.freeze({
    issue(mode = 'completed') {
      const result = eligibility(mode);
      if (result.reason) return Object.freeze({ allowed: false, reason: result.reason });
      const { c, evaluated, target } = result;
      const permit = Object.freeze({ courseKey: evaluated.fresh.courseKey, lessonKey: evaluated.fresh.lesson.key,
        revision: c.inventory.revision, generation: c.generation, targetKey: target.key, mode, expires: now() + ttl,
        evidence: evaluated.fresh.lesson.credit });
      permits.set(permit, { inventory: c.inventory, used: false });
      return Object.freeze({ allowed: true, permit });
    },
    consume(permit) {
      const stored = permits.get(permit);
      if (!stored || stored.used) return null;
      stored.used = true;
      const result = eligibility(permit.mode);
      if (result.reason || now() >= permit.expires || result.c.inventory !== stored.inventory ||
        result.c.generation !== permit.generation || result.c.inventory.revision !== permit.revision ||
        result.evaluated.fresh.courseKey !== permit.courseKey || result.evaluated.fresh.lesson.key !== permit.lessonKey ||
        result.target.key !== permit.targetKey) return null;
      return Object.freeze({ ...permit, target: result.target });
    },
    renew(permit) {
      const stored = permits.get(permit);
      if (!stored || stored.used) return null;
      const result = eligibility(permit.mode);
      if (result.reason || result.c.inventory !== stored.inventory || result.c.generation !== permit.generation ||
        result.c.inventory.revision !== permit.revision || result.evaluated.fresh.courseKey !== permit.courseKey ||
        result.evaluated.fresh.lesson.key !== permit.lessonKey || result.target.key !== permit.targetKey) return null;
      stored.used = true;
      const renewed = Object.freeze({ ...permit, evidence: result.evaluated.fresh.lesson.credit, expires: now() + ttl });
      permits.set(renewed, { inventory: stored.inventory, used: false }); return renewed;
    }
  });
}

Object.assign(__exports, {createNavigationGate});
},
"src/adapters/video.js": function(__exports, __require) {
const { startMedia } = __require("src/adapters/media.js");
function createVideoAdapter({ enabled = true, background = true } = {}) {
  return Object.freeze({ recognize: task => enabled && task.kind === 'video' && task.identity === 'verified' && Boolean(task.player),
    start: context => startMedia(context, 'video', { background }) });
}

Object.assign(__exports, {createVideoAdapter});
},
"src/adapters/media.js": function(__exports, __require) {
const { captureMediaSource, matchesMediaSource } = __require("src/platform/media-source.js");
/** Native media effects only. Scheduling and authority remain with the coordinator. */
function startMedia(context, kind, { background = true } = {}) {
  const media = context.task.player;
  if (!media || media.tagName.toLowerCase() !== kind) return Promise.reject(Error('missing-owned-player'));
  const originalSource = captureMediaSource(media), document = media.ownerDocument;
  let disposed = false, activated = false, started = false, pendingEnd = false, ended = false;
  let sequence = 0, playSequence = 0, inFlight = false, mutedFallback = false, readinessRetry = false;
  let recoveries = 0, lastRecovery = -Infinity, lastPosition = media.currentTime, lastProgress = context.now();
  const deadline = context.now() + 5000, listeners = [], ownedActions = new Set();
  let resolveStart, rejectStart;
  const result = new Promise((resolve, reject) => { resolveStart = resolve; rejectStart = reject; });
  const unchanged = () => media.isConnected && matchesMediaSource(originalSource, media);
  const valid = () => !disposed && !context.signal.aborted && unchanged() && context.isCurrent();
  function listen(target, event, fn) { target.addEventListener(event, fn); listeners.push(() => target.removeEventListener(event, fn)); }
  function dispose() {
    if (disposed) return;
    disposed = true; playSequence++;
    for (const remove of listeners) remove();
    for (const key of ownedActions) context.cancelScheduled(key);
    ownedActions.clear();
    if (unchanged() && !media.ended) media.pause();
    if (!started) rejectStart(Error('cancelled'));
  }
  function failure(reason) {
    if (disposed) return;
    if (!started) { rejectStart(Error(reason)); dispose(); }
    else { context.fail(reason); dispose(); }
  }
  function schedule(delay, fn) {
    const key = `media-${++sequence}`; ownedActions.add(key);
    if (!context.schedule({ key, delay, execute() { ownedActions.delete(key); if (valid()) fn(); else dispose(); } })) {
      ownedActions.delete(key); dispose();
    }
  }
  function rate() { if (valid()) { media.defaultPlaybackRate = 1; media.playbackRate = 1; } }
  function localEnd() {
    if (ended || !started || !valid() || !media.ended || media.loop) return;
    ended = true;
    if (!activated) { pendingEnd = true; return; }
    context.done(); dispose();
  }
  const handle = Object.freeze({ cancel: dispose, activate() {
    if (!valid()) { dispose(); return; }
    activated = true;
    if (pendingEnd && media.ended) { context.done(); dispose(); } else {
      localEnd();
      if (!disposed) {
        const key = 'media-monitor'; ownedActions.add(key);
        context.scheduleRecurring({ key, delay: 1000, execute: monitor });
      }
    }
  } });
  function attempt() {
    if (!valid()) { dispose(); return; }
    if (inFlight) return;
    if (media.ended) { if (started) localEnd(); else failure('ended-before-successful-start'); return; }
    if (media.error) { failure(`media-error-${media.error.code}`); return; }
    if (!originalSource.usable) { waitReady(); return; }
    rate(); inFlight = true; const call = ++playSequence;
    schedule(5000, () => { if (inFlight && call === playSequence) failure('play-timeout'); });
    let promise;
    try { promise = media.play(); } catch (error) { promise = Promise.reject(error); }
    Promise.resolve(promise).then(() => {
      if (!valid()) { dispose(); return; }
      if (call !== playSequence) return;
      inFlight = false;
      if (started) context.note?.('media-running');
      if (media.error || media.paused && !media.ended) { failure('play-did-not-start'); return; }
      rate(); lastProgress = context.now(); lastPosition = media.currentTime;
      if (!started) { started = true; resolveStart(handle); }
      localEnd();
    }, error => {
      if (!valid() || call !== playSequence) { dispose(); return; }
      inFlight = false;
      if (error?.name === 'NotAllowedError' && !mutedFallback) {
        mutedFallback = true; media.muted = true; attempt(); return;
      }
      if (!started && !readinessRetry && error?.name === 'AbortError' && context.now() < deadline) {
        readinessRetry = true; schedule(250, attempt); return;
      }
      failure(error?.name === 'NotAllowedError' ? 'autoplay-denied-after-fallback' : error?.name === 'NotSupportedError' ? 'unsupported-media' : error?.name === 'AbortError' ? 'play-aborted' : 'play-failed');
    });
  }
  let waiting = false;
  function waitReady() {
    if (waiting || disposed) return;
    if (context.now() >= deadline) { failure('readiness-timeout'); return; }
    waiting = true;
    schedule(Math.min(100, deadline - context.now()), () => { waiting = false; attempt(); });
  }
  function recover() {
    if (!valid() || !started || !activated || ended || media.ended || inFlight) return;
    if (media.error) { failure(`media-error-${media.error.code}`); return; }
    const time = context.now();
    if (!media.paused && time - lastProgress < 8000) return;
    if (time - lastRecovery < 3000) return;
    if (recoveries >= 3) { failure('recovery-exhausted'); return; }
    recoveries++; lastRecovery = time; context.note?.('recovering-media'); attempt();
  }
  function monitor() {
    if (!valid() || ended || !activated) return;
    if (media.error) { failure(`media-error-${media.error.code}`); return; }
    if (media.currentTime > lastPosition) { lastPosition = media.currentTime; lastProgress = context.now(); }
    if (background) recover();
  }
  listen(media, 'ended', () => { if (!started) pendingEnd = media.ended; else localEnd(); });
  listen(media, 'ratechange', rate);
  listen(media, 'timeupdate', () => {
    if (valid() && media.currentTime > lastPosition) { lastPosition = media.currentTime; lastProgress = context.now(); }
  });
  listen(media, 'error', () => failure(`media-error-${media.error?.code || 'unknown'}`));
  if (background) {
    listen(media, 'pause', recover); listen(media, 'stalled', recover);
    const scopes = new Set([document, context.task.owner.ownerDocument, ...context.task.path.map(node => node.ownerDocument)]);
    for (const scope of scopes) {
      for (const name of ['blur','focus']) listen(scope.defaultView, name, recover);
      listen(scope, 'visibilitychange', recover); listen(scope, 'mouseleave', recover);
    }
  }
  listen(context.signal, 'abort', dispose);
  media.muted = false;
  if (media.ended) { failure('already-ended-without-owned-playback'); return result; }
  attempt(); return result;
}

Object.assign(__exports, {startMedia});
},
"src/adapters/audio.js": function(__exports, __require) {
const { startMedia } = __require("src/adapters/media.js");
function createAudioAdapter({ enabled = true, background = true } = {}) {
  return Object.freeze({ recognize: task => enabled && task.kind === 'audio' && task.identity === 'verified' && Boolean(task.player),
    start: context => startMedia(context, 'audio', { background }) });
}

Object.assign(__exports, {createAudioAdapter});
},
"src/adapters/document.js": function(__exports, __require) {
/** Native accessible HTML viewer geometry only; no guessed PDF-plugin selectors. */
function locateReader(task) {
  const documents = [], candidates = [];
  function visit(doc, depth = 0) {
    if (!doc || depth > 8 || documents.includes(doc)) throw Error('reader-inaccessible-or-cyclic');
    documents.push(doc);
    if (doc.contentType !== 'text/html' || !doc.body) throw Error('reader-unsupported-document');
    if (doc.querySelector('embed,object,video,audio')) throw Error('reader-unsupported-media-surface');
    const root = doc.scrollingElement;
    for (const element of [root, ...doc.querySelectorAll('body *')].filter(Boolean)) {
      const style = doc.defaultView.getComputedStyle(element);
      if (element.clientHeight > 0 && element.scrollHeight > element.clientHeight &&
        (element === root || /auto|scroll/.test(style.overflowY || style.overflow))) candidates.push(element);
    }
    for (const frame of doc.querySelectorAll('iframe')) {
      let child; try { child = frame.contentDocument; } catch { /* Explicit access boundary. */ }
      visit(child, depth + 1);
    }
  }
  if (task.owner.tagName !== 'IFRAME') throw Error('reader-unverified-owner');
  visit(task.owner.contentDocument);
  const unique = [...new Set(candidates)];
  if (unique.length > 1) throw Error('reader-ambiguous-scroll-owner');
  if (unique.length === 1) return unique[0];
  // Fitting content is supported only with a real viewport and nonempty HTML body.
  const fitting = documents.filter(doc => doc.scrollingElement?.clientHeight > 0 && doc.body.textContent.trim() &&
    !doc.querySelector('iframe,embed,object') && doc.scrollingElement.scrollHeight >= doc.scrollingElement.clientHeight);
  return fitting.length === 1 ? fitting[0].scrollingElement : null;
}

function createDocumentAdapter({ enabled = true, random = Math.random } = {}) {
  return Object.freeze({ recognize: task => enabled && task.kind === 'document' && task.identity === 'verified',
    start(context) {
      let viewer, disposed = false, stable = 0, lastRange = null, lastTop = null, stuck = 0;
      let resolve, reject, waitingKey = 0;
      const initialDeadline = context.now() + 5000, scheduled = new Set();
      const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
      function cancel() { if (disposed) return; disposed = true; for (const key of scheduled) context.cancelScheduled(key); context.signal.removeEventListener('abort', cancel); reject(Error('reader-cancelled')); }
      function fail(reason) { reject(Error(reason)); context.fail(reason); cancel(); }
      function delay() { const n = random(); if (!(n >= 0 && n < 1)) throw Error('invalid-reader-random'); return 400 + Math.floor(n * 501); }
      function sample() {
        if (disposed || !context.isCurrent()) return;
        let fresh; try { fresh = locateReader(context.task); } catch (error) { fail(error.message); return; }
        if (!fresh || fresh !== viewer || !viewer.isConnected) { fail('reader-owner-replaced'); return; }
        const range = viewer.scrollHeight - viewer.clientHeight, top = viewer.scrollTop;
        if (!Number.isFinite(range) || range < 0 || !Number.isFinite(top)) { fail('reader-invalid-geometry'); return; }
        stable = range === lastRange && Math.abs(top - range) <= 1 ? stable + 1 : 0;
        if (stable >= 3) { context.done(); cancel(); return; }
        if (top < range - 1) {
          if (top === lastTop && range === lastRange) stuck++; else stuck = 0;
          if (stuck >= 3) { fail('reader-no-observed-movement'); return; }
          const n = random(); if (!(n >= 0 && n < 1)) { fail('invalid-reader-random'); return; }
          viewer.scrollTop = Math.min(range, top + Math.max(1, Math.floor(viewer.clientHeight * (0.15 + n * 0.2))));
        }
        lastTop = top; lastRange = range;
      }
      const handle = Object.freeze({ cancel, activate() {
        if (disposed) return;
        // Variable intervals under the same recurring scheduler, using fixed short
        // ticks and a local next deadline rather than unbounded one-shot history.
        let due = context.now(); const key = 'document-reader'; scheduled.add(key);
        context.scheduleRecurring({ key, delay: 100, execute() { if (context.now() >= due) { sample(); due = context.now() + delay(); } } });
      } });
      function ready() {
        if (disposed || !context.isCurrent()) { cancel(); return; }
        try { viewer = locateReader(context.task); } catch (error) { fail(error.message); return; }
        if (viewer) { resolve(handle); return; }
        if (context.now() >= initialDeadline) { fail('reader-readiness-timeout'); return; }
        const key = `reader-ready-${++waitingKey}`; scheduled.add(key);
        context.schedule({ key, delay: 100, execute() { scheduled.delete(key); ready(); } });
      }
      context.signal.addEventListener('abort', cancel); ready(); return promise;
    } });
}

Object.assign(__exports, {locateReader,createDocumentAdapter});
},
"src/adapters/live.js": function(__exports, __require) {
const { captureMediaSource, matchesMediaSource } = __require("src/platform/media-source.js");
function describeLive(task) {
  const entry = task.owner;
  if (task.kind !== 'live' || task.identity !== 'verified' || !entry.isConnected || !entry.matches('a.liveHref') || !entry.querySelector('.liveCard .live-ct')) return null;
  const label = entry.textContent.trim();
  const status = /未开始|预约/.test(label) ? 'scheduled' : /直播中/.test(label) ? 'ongoing' : /回放/.test(label) ? 'replay' : /加载|不可用/.test(label) ? 'unavailable' : 'unknown';
  let destination = null; try { const url = new URL(entry.getAttribute('href'), entry.baseURI); if (['http:','https:'].includes(url.protocol) && entry.hasAttribute('href')) destination = url.href; } catch { /* Do not guess. */ }
  return Object.freeze({ status, destination, reason: destination ? 'native-user-opening-only' : 'native-destination-unverified' });
}

/** Observe the original entry; never invoke its handler or infer popup success. */
function createLiveAdapter() {
  return Object.freeze({ recognize: task => Boolean(describeLive(task)), start(context) {
    const entry = context.task.owner, href = entry.getAttribute('href'); let observed = false;
    const click = event => { if (event.isTrusted && !observed && context.isCurrent() && entry.getAttribute('href') === href) {
      observed = true; context.note('native-live-activation-observed-outcome-unverified');
    } };
    const cancel = () => { entry.removeEventListener('click', click); context.signal.removeEventListener('abort', cancel); };
    entry.addEventListener('click', click); context.signal.addEventListener('abort', cancel);
    return { cancel, activate() { context.note(describeLive(context.task)?.reason || 'live-entry-invalid'); } };
  } });
}

/** Local observations only. No message transport, task done, navigation or close. */
function observeReplay(media, { signal, isCurrent, ownedHandle = null }) {
  const source = captureMediaSource(media); let ended = false, progressed = false, disposed = false, position = media.currentTime;
  const valid = () => !disposed && !signal.aborted && isCurrent() && media.isConnected && matchesMediaSource(source, media);
  const progress = () => { if (valid() && media.currentTime > position) progressed = true; position = media.currentTime; };
  const finish = () => { if (valid() && progressed && media.ended && !media.loop) ended = true; };
  const cancel = () => { disposed = true; media.removeEventListener('timeupdate', progress); media.removeEventListener('ended', finish); signal.removeEventListener('abort', cancel); };
  media.addEventListener('timeupdate', progress); media.addEventListener('ended', finish); signal.addEventListener('abort', cancel);
  return Object.freeze({ cancel, snapshot() {
    let closed = null; if (ownedHandle) try { closed = ownedHandle.closed === true; } catch { /* Unknown is not closed. */ }
    return Object.freeze({ valid: valid(), type: Number.isFinite(media.duration) && media.duration > 0 ? 'finite-replay' : 'unknown-or-live',
      naturalEnd: valid() && ended, closed, prematureClosure: closed === true && !ended, completionAuthority: false,
      reason: 'unverified-cross-window-provenance-manual-continuation-required' });
  }, acceptMessage: () => false, closeChild: () => false });
}

Object.assign(__exports, {describeLive,createLiveAdapter,observeReplay});
},
"src/runtime/native-navigation.js": function(__exports, __require) {
const { inspectInventory } = __require("src/platform/inventory.js");
/** The only catalog effect port. It never constructs URLs or claims click success. */
function createNativeNavigation(document, reader, currentInventory) {
  return Object.freeze({ activate(authorization, { signal }) {
    const previous = currentInventory(), fresh = inspectInventory(previous), target = authorization.target;
    if (!fresh.valid || fresh.courseKey !== authorization.courseKey || fresh.lesson.key !== authorization.lessonKey ||
      !target.node.isConnected || target.node.ownerDocument !== document ||
      fresh.catalog.filter(item => item.key === target.key && item.node === target.node && !item.restricted).length !== 1) throw Error('native-target-invalid');
    const oldDocuments = fresh.documents, oldTasks = fresh.tasks;
    return new Promise((resolve, reject) => {
      const observer = new document.defaultView.MutationObserver(check), watched = new WeakSet();
      function cleanup() { observer.disconnect(); document.removeEventListener('load', check, true); signal.removeEventListener('abort', abort); }
      function abort() { cleanup(); reject(Error('native-navigation-cancelled')); }
      function check() {
        if (signal.aborted) { abort(); return; }
        const next = reader.scan(document), evidence = inspectInventory(next);
        for (const doc of [document, ...evidence.documents]) if (!watched.has(doc)) { watched.add(doc); observer.observe(doc, { subtree: true, childList: true, attributes: true }); }
        const changed = evidence.documents.some(doc => !oldDocuments.includes(doc)) || evidence.tasks.some(task =>
          !oldTasks.some(old => old.owner === task.owner && old.player === task.player && old.source === task.source));
        if (evidence.valid && evidence.courseKey === authorization.courseKey && evidence.lesson.key === authorization.targetKey && changed) {
          cleanup(); resolve(next);
        }
      }
      if (signal.aborted) { abort(); return; }
      signal.addEventListener('abort', abort); document.addEventListener('load', check, true);
      watched.add(document); observer.observe(document, { subtree: true, childList: true, attributes: true });
      try { target.node.click(); check(); } catch (error) { cleanup(); reject(error); }
    });
  } });
}

Object.assign(__exports, {createNativeNavigation});
},
"src/runtime/preferences.js": function(__exports, __require) {
const storageKey = 'xxt.state.v1';
const defaults = Object.freeze({ automation: true, video: true, audio: true, document: true, continuation: true,
  navigation: false, background: true, delays: true, minMs: 5000, maxMs: 12000,
  restEnabled: false, restCount: null, restMs: null });

function validateSettings(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !Object.hasOwn(defaults,key))) throw Error('invalid-settings');
  const settings = { ...defaults, ...input };
  for (const key of Object.keys(defaults).filter(key => typeof defaults[key] === 'boolean')) if (typeof settings[key] !== 'boolean') throw Error('invalid-settings');
  if (![settings.minMs,settings.maxMs].every(n => Number.isSafeInteger(n) && n >= 0 && n <= 60000) || settings.minMs > settings.maxMs) throw Error('invalid-delay-range');
  if (settings.restCount !== null && (!Number.isSafeInteger(settings.restCount) || settings.restCount < 1 || settings.restCount > 1000)) throw Error('invalid-rest-count');
  if (settings.restMs !== null && (!Number.isSafeInteger(settings.restMs) || settings.restMs < 1000 || settings.restMs > 86400000)) throw Error('invalid-rest-duration');
  if (settings.restEnabled && (settings.restCount === null || settings.restMs === null)) throw Error('rest-configuration-required');
  return Object.freeze(settings);
}
function sampleDelay(settings, random = Math.random) {
  if (!settings.delays) return 0;
  const draw = random(); if (!(draw >= 0 && draw < 1)) throw Error('invalid-random');
  return settings.minMs + Math.floor(draw * (settings.maxMs - settings.minMs + 1));
}

function createPreferences(storage, now = () => Date.now()) {
  const fresh = () => ({ version: 1, settings: defaults, stopped: false, restUntil: 0, count: 0, seen: [] });
  let state = fresh(), error = null;
  function validate(value) {
    if (!value || value.version !== 1 || typeof value.stopped !== 'boolean' || !Number.isSafeInteger(value.restUntil) || value.restUntil < 0 ||
      !Number.isSafeInteger(value.count) || value.count < 0 || !Array.isArray(value.seen) || value.seen.length > 2048 ||
      value.seen.some(key => typeof key !== 'string' || !key) || new Set(value.seen).size !== value.seen.length) throw Error('invalid-stored-state');
    return { version: 1, settings: validateSettings(value.settings), stopped: value.stopped, restUntil: value.restUntil, count: value.count, seen: [...value.seen] };
  }
  function save(next) {
    try { const checked = validate(next); storage.setItem(storageKey, JSON.stringify(checked)); state = checked; error = null; }
    catch { error = 'storage-unavailable'; state = { ...state, stopped: true }; throw Error(error); }
  }
  try {
    const raw = storage.getItem(storageKey);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (parsed.version === 0 && typeof parsed.stopped === 'boolean') save({ ...fresh(), stopped: parsed.stopped, settings: validateSettings(parsed.settings) });
      else state = validate(parsed);
    }
  } catch { error = 'invalid-or-unavailable-storage'; state = { ...fresh(), stopped: true }; }
  return Object.freeze({
    snapshot: () => Object.freeze({ ...state, settings: state.settings, seen: Object.freeze([...state.seen]), error }),
    stop() { save({ ...state, stopped: true }); },
    resume() { if (error) throw Error(error); save({ ...state, stopped: false }); },
    update(patch) { save({ ...state, settings: validateSettings({ ...state.settings, ...patch }) }); },
    restore() { save(error ? { ...fresh(), stopped: true } : { ...state, settings: defaults }); },
    record(key, kind) {
      if (!['video','audio','document'].includes(kind) || state.seen.includes(key)) return false;
      if (state.seen.length >= 2048) { error = 'pacing-capacity-reached'; throw Error(error); }
      const count = state.count + 1, rest = state.settings.restEnabled && count >= state.settings.restCount;
      save({ ...state, seen: [...state.seen, key], count: rest ? 0 : count,
        restUntil: rest ? now() + state.settings.restMs : state.restUntil }); return true;
    },
    resting: () => state.restUntil > now()
  });
}

Object.assign(__exports, {storageKey,defaults,validateSettings,sampleDelay,createPreferences});
},
"src/runtime/diagnostics.js": function(__exports, __require) {
const categories = new Set(['recognition','selection','outcome','recovery','manual','credit','navigation','stop','settings','storage']);
const kinds = new Set(['video','audio','document','live','assessment','unknown']);
const states = new Set(['DISCOVERED','PENDING','READY','STARTING','RUNNING','LOCAL_COMPLETED','WAITING_PLATFORM','FAILED','UNRESOLVED','UNSUPPORTED','PAUSED','CANCELLED']);
function createDiagnostics() {
  let rows = [];
  return Object.freeze({ add(category, state, kind) {
    if (!categories.has(category)) return;
    rows.push(Object.freeze({ category, state: states.has(state) ? state : 'OTHER', kind: kinds.has(kind) ? kind : 'unknown' }));
    rows = rows.slice(-100);
  }, export: () => JSON.stringify({ format: 'xxt-diagnostics-v1', events: rows }), clear() { rows = []; } });
}

Object.assign(__exports, {createDiagnostics});
},
"src/ui/panel.js": function(__exports, __require) {
const labels = { automation: '主自动化', video: '视频', audio: '音频', document: '文档', continuation: '安全续接', navigation: '允许小节/章节导航', background: '后台恢复', delays: '随机延迟', restEnabled: '周期休息' };
const names = { video: '视频', audio: '音频', document: '文档', live: '直播（手动）', assessment: '测验（不作答）', unknown: '未知', 'book-knowledge-map': '书籍/知识图谱（仅识别）', 'timed-reader': '计时阅读（仅识别）', 'audio-slides': '音频幻灯（仅识别）', hyperlink: '链接任务（仅识别）', 'legacy-multimedia': '旧式动画（不支持执行）' };
function mountPanel(document, app) {
  const host = document.createElement('aside'); host.id = 'xxt-control';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = '<style>:host{position:fixed;right:8px;bottom:8px;z-index:2147483000;font:12px sans-serif;color:#222}details{background:#fff;border:1px solid #777;border-radius:6px;padding:6px;max-width:280px;box-shadow:0 1px 6px #999}section{max-height:55vh;overflow:auto;width:260px}label{display:inline-block;margin:3px}input[type=number]{width:85px}button{margin:3px}pre{white-space:pre-wrap;max-height:120px;overflow:auto}textarea{width:95%;height:100px}</style><details><summary>XXT 开发测试版</summary><section><pre id="status"></pre><div id="actions"></div><div id="settings"></div><pre id="error"></pre><textarea hidden aria-label="脱敏诊断"></textarea></section></details>';
  const fields = new Map(), error = root.querySelector('#error');
  function act(fn) { try { fn(); error.textContent = ''; } catch { error.textContent = '操作失败：请检查设置或本地存储；自动化保持安全暂停。'; } render(); }
  for (const [text, fn] of [['开始',app.start],['停止',app.stop],['恢复',app.resume],['重扫当前小节',app.rescan],['恢复默认',app.restore],['查看脱敏诊断',() => { const box = root.querySelector('textarea'); box.hidden = false; box.value = app.exportDiagnostics(); }],['清空诊断',app.clearDiagnostics]]) {
    const button = document.createElement('button'); button.textContent = text; button.addEventListener('click', () => act(fn)); root.querySelector('#actions').append(button);
  }
  for (const [key, text] of Object.entries({ ...labels, minMs: '延迟下限 ms', maxMs: '延迟上限 ms', restCount: '休息任务数（先配置）', restMs: '休息时长 ms（先配置）' })) {
    const label = document.createElement('label'), input = document.createElement('input'); label.textContent = text;
    input.type = key in labels ? 'checkbox' : 'number'; input.dataset.setting = key;
    input.addEventListener('change', () => act(() => app.update({ [key]: input.type === 'checkbox' ? input.checked : input.value === '' ? null : Number(input.value) })));
    label.append(input); root.querySelector('#settings').append(label); fields.set(key, input);
  }
  function render() {
    const view = app.view(), task = view.task;
    for (const [key, input] of fields) if (input.type === 'checkbox') input.checked = view.settings[key]; else if (root.activeElement !== input) input.value = view.settings[key] ?? '';
    const stateNames = { READY: '等待启动', STARTING: '启动中', RUNNING: task?.kind === 'live' ? '人工等待' : '运行中', WAITING_PLATFORM: '等待平台信用', FAILED: '失败', UNRESOLVED: '未解决', UNSUPPORTED: '不支持', PAUSED: '暂停', CANCELLED: '已取消' };
    root.querySelector('#status').textContent = `状态：${view.message} ${stateNames[view.taskState] || ''}\n任务：${names[task?.kind] || '等待识别'} ${task ? `${task.ordinal + 1}/${view.total}` : ''}\n本地结果：${view.localDone ? '已处理，非平台完成' : '尚未处理'}\n平台信用：${view.platformConfirmed ? '已确认' : '未确认'}\n休息剩余：${Math.max(0, Math.ceil(view.restRemaining / 1000))}秒\n延迟：${view.delayed ? '等待中' : '无'}\n未知/PDF专有阅读器及未验证直播需人工处理`;
    if (!root.querySelector('textarea').hidden) root.querySelector('textarea').value = app.exportDiagnostics();
  }
  document.body.append(host); render(); return Object.freeze({ render, destroy() { host.remove(); }, host });
}

Object.assign(__exports, {mountPanel});
},
"src/runtime/native-tabs.js": function(__exports, __require) {
/** Evidenced objective/video labels only; numeric-only tabs are never inferred. */
function objectiveVideoTab(document) {
  const titles = [...document.querySelectorAll('.prev_title')];
  if (titles.length !== 1 || (titles[0].getAttribute('title') || titles[0].textContent).trim() !== '学习目标') return null;
  if (document.querySelector('input[type=password],input[autocomplete="one-time-code"]')) return null;
  const matches = [...document.querySelectorAll('.prev_white')].filter(node => {
    const style = document.defaultView.getComputedStyle(node);
    return node.isConnected && !node.hidden && style.display !== 'none' && style.visibility !== 'hidden' &&
      /^(?:\d+\s*)?视频$/.test(node.textContent.trim()) && !node.closest('[aria-disabled="true"],[disabled]');
  });
  return matches.length === 1 ? matches[0] : null;
}
function activateObjectiveTab(document, target) {
  if (objectiveVideoTab(document) !== target) return false;
  target.click(); return true; // Original native handler, no fabricated trusted gesture.
}

Object.assign(__exports, {objectiveVideoTab,activateObjectiveTab});
}
};
const __cache=Object.create(null);
function __require(id){if(__cache[id])return __cache[id];const out=Object.create(null);__cache[id]=out;__modules[id](out,__require);return out;}
__require("src/entry.js");
})();
