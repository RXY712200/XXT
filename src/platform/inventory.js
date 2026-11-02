import { Credit, evidence, identity } from '../core/contracts.js';
import { captureMediaSource, matchesMediaSource } from './media-source.js';
import { recognizeSpecial } from './special.js';

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
export function createInventoryReader() {
  let revision = 0;
  return Object.freeze({ scan(document) {
    const initial = read(document), snapshot = Object.freeze({ ...initial, structure: undefined, revision: ++revision });
    const sources = initial.documents.flatMap(doc => all(doc, 'video,audio')).map(media => [media, captureMediaSource(media)]);
    inventories.set(snapshot, () => {
      const fresh = read(document);
      // Adapted from fork _priorCompletionValid/_refreshVideoContext: only detached
      // catalog members may be rebound; media, source and frame identity stay exact.
      const replacements = new Map();
      const equivalent = fresh.lesson?.credit.status === Credit.CONFIRMED && fresh.courseKey === initial.courseKey && fresh.lesson?.key === initial.lesson?.key &&
        fresh.catalog.length === initial.catalog.length && fresh.catalog.every((item,i) => {
          const old = initial.catalog[i];
          if (item.key !== old.key || item.title !== old.title || item.chapterKey !== old.chapterKey || JSON.stringify(item.ancestry) !== JSON.stringify(old.ancestry)) return false;
          if (old.node !== item.node) { if (old.node.isConnected) return false; replacements.set(old.node,item.node); }
          return true;
        }) && fresh.chapters.length === initial.chapters.length && fresh.chapters.every((item,i) => {
          const old = initial.chapters[i];if(item.key!==old.key||item.title!==old.title)return false;
          if(old.node!==item.node){if(old.node.isConnected)return false;replacements.set(old.node,item.node);}return true;
        });
      if (equivalent && initial.catalog[0]) {
        const oldTree = initial.catalog[0].node.closest('#coursetree'), newTree = fresh.catalog[0]?.node.closest('#coursetree');
        if(oldTree && oldTree!==newTree && !oldTree.isConnected)replacements.set(oldTree,newTree);
      }
      const same = fresh.structure.length === initial.structure.length && fresh.structure.every((value,i) => value === initial.structure[i] || equivalent && replacements.has(initial.structure[i]) && replacements.get(initial.structure[i]) === value);
      return Object.freeze({ valid: same && sources.every(([media, expected]) => matchesMediaSource(expected, media)) && fresh.status === 'verified', revision: snapshot.revision, ...fresh, structure: undefined });
    });
    return snapshot;
  } });
}

/** Always reread scoped DOM evidence; reject caller-created inventory objects. */
export function inspectInventory(inventory) {
  const inspect = inventories.get(inventory);
  if (!inspect) throw new TypeError('Inventory must come from the platform reader');
  return inspect();
}
