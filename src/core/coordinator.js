import { State, transition } from './contracts.js';
import { evaluateCompletion } from './completion.js';
import { createScheduler } from './scheduler.js';
import { createNavigationGate } from './navigation.js';
import { inspectInventory } from '../platform/inventory.js';

/** No real adapters or browser effects are installed here. Ports must be explicit. */
export function createCoordinator({ clock, adapters = {}, delayFor = () => 0, continueKnownAfterFailure = false } = {}) {
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
    diagnostic = 'local-ended-not-platform-credit'; release(token); return true;
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
        diagnostic = 'unsupported-task-boundary'; return false;
      }
      if (evaluation.taskConfirmed.includes(candidate.key) || candidate.state === State.WAITING_PLATFORM) continue;
      if (candidate.state === State.UNRESOLVED && continueKnownAfterFailure) continue;
      if (candidate.state !== State.PENDING) { diagnostic = 'unresolved-task'; return false; }
      record = candidate; break;
    }
    if (!record) { diagnostic = 'waiting-platform-evidence'; return false; }
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
          cancelScheduled(key) { return scheduler.cancel(`${token.generation}:task:${record.key}:${key}`); },
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
  function queueNavigation(permit, port, { delay = 0, acknowledgementMs = 3000 } = {}) {
    if (navigation || active || !valid() || typeof port?.activate !== 'function' ||
      !Number.isSafeInteger(acknowledgementMs) || acknowledgementMs < 1 || acknowledgementMs > 30000) return false;
    const expectedGeneration = generation, source = inventory;
    return scheduler.request({ key: `${generation}:navigate`, delay,
      validate: () => generation === expectedGeneration && inventory === source && valid() && !active && !navigation,
      onInvalid: () => invalidate('context-invalidated'),
      onError: () => { if (generation === expectedGeneration) invalidate('navigation-effect-failed', true); },
      execute() {
        const authorization = gate.consume(permit);
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
            (!old.player || task.player === old.player && task.source === old.source && task.declaredSource === old.declaredSource);
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
