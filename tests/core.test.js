import test from 'node:test';
import assert from 'node:assert/strict';
import { createInventoryReader } from '../src/platform/inventory.js';
import { State, Credit, transition } from '../src/core/contracts.js';
import { createScheduler } from '../src/core/scheduler.js';
import { createCoordinator } from '../src/core/coordinator.js';
import { evaluateCompletion } from '../src/core/completion.js';
import { acquireSession } from '../src/runtime/session.js';
import { page, clock, microtasks } from './support.js';

function setup(kinds = ['video'], options = {}) {
  const fixture = page(kinds, options), time = clock(), reader = createInventoryReader(), contexts = [];
  let starts = 0, cancels = 0;
  const adapter = { recognize: () => true, start(context) {
    contexts.push(context); starts++; return { cancel() { cancels++; } };
  } };
  const coordinator = createCoordinator({ clock: time, adapters: { video: adapter, audio: adapter, document: adapter }, ...options });
  coordinator.bind(reader.scan(fixture.document));
  return { ...fixture, time, reader, contexts, coordinator, starts: () => starts, cancels: () => cancels,
    async start() { const result = coordinator.startNext(); time.advance(0); await microtasks(); return result; } };
}
const states = c => c.snapshot().records.map(record => record.state);
function creditTask(f, i = 0) { f.owners[i].parentElement.querySelector('.ans-job-icon').classList.add('ans-job-finished'); }
function fakePort(f) {
  let calls = 0;
  return { calls: () => calls, activate(authorization) {
    calls++;
    f.document.querySelector('.posCatalog_active').classList.remove('posCatalog_active');
    authorization.target.node.classList.add('posCatalog_active');
    return f.reader.scan(f.document);
  } };
}

test('scheduler has one deadline per logical key; cancelled/stale callback cannot act', () => {
  const time = clock(), scheduler = createScheduler(time); let effects = 0, allowed = true;
  const request = key => scheduler.request({ key, delay: 13, validate: () => allowed, execute: () => effects++ });
  assert.equal(request('one'), true); assert.equal(request('one'), false);
  assert.equal(scheduler.snapshot()[0].deadline, 13);
  scheduler.cancel('one'); time.cancelled[0](); time.advance(13); assert.equal(effects, 0);
  assert.equal(request('one'), false); request('two'); allowed = false; time.advance(13);
  assert.equal(effects, 0); assert.equal(scheduler.snapshot()[1].status, 'invalidated');
  assert.throws(() => scheduler.request({ key: 'bad', delay: 0.5 }), RangeError);
});

test('legal task transitions are explicit and local end is never platform credit', async () => {
  assert.throws(() => transition({ state: State.PENDING, history: [] }, State.RUNNING), /Illegal/);
  const f = setup(); assert.equal(await f.start(), true);
  assert.deepEqual(states(f.coordinator), [State.RUNNING]);
  assert.equal(f.contexts[0].done(), true); assert.equal(f.contexts[0].done(), false);
  const record = f.coordinator.snapshot().records[0];
  assert.deepEqual(record.history, ['DISCOVERED','PENDING','READY','STARTING','RUNNING','LOCAL_COMPLETED','WAITING_PLATFORM']);
  assert.equal(evaluateCompletion(f.coordinator.snapshot().inventory).lessonConfirmed, false);
  assert.equal(f.coordinator.navigationDecision().allowed, false);
});

test('mixed order retains credited tasks and executes one unfinished known task at a time', async () => {
  const f = setup(['video', 'video', 'audio', 'document'], { completed: [0] });
  await f.start(); assert.equal(f.starts(), 1); assert.equal(f.contexts[0].task.ordinal, 1);
  assert.equal(f.coordinator.startNext(), false);
  f.contexts[0].done(); await f.start(); assert.equal(f.contexts[1].task.kind, 'audio');
  f.contexts[1].done(); await f.start(); assert.equal(f.contexts[2].task.kind, 'document');
  assert.equal(f.coordinator.snapshot().records.length, 4);
  assert.deepEqual(states(f.coordinator), [State.PENDING, State.WAITING_PLATFORM, State.WAITING_PLATFORM, State.RUNNING]);
});

test('unknown boundaries and absent production adapters cannot execute or be skipped', async () => {
  const f = setup(['video', 'unknown', 'audio']); await f.start(); f.contexts[0].done();
  assert.equal(await f.start(), false); assert.equal(f.starts(), 1);
  f.markLesson(); assert.equal(f.coordinator.navigationDecision('prior-credit').allowed, false);
  const p = page(); const c = createCoordinator(); c.bind(createInventoryReader().scan(p.document));
  assert.equal(c.startNext(), false); assert.deepEqual(states(c), [State.UNSUPPORTED]);
});

test('failed media cannot navigate; same-lesson continuation requires explicit known-order policy', async () => {
  const f = setup(['audio','video']); await f.start(); f.contexts[0].fail('denied');
  assert.equal(await f.start(), false); f.markLesson();
  assert.equal(f.coordinator.navigationDecision('prior-credit').allowed, false);
  const g = setup(['audio','video'], { continueKnownAfterFailure: true }); await g.start(); g.contexts[0].fail('denied');
  assert.equal(await g.start(), true); assert.equal(g.contexts[1].task.kind, 'video');
  g.contexts[1].done(); g.markLesson(); assert.equal(g.coordinator.navigationDecision().allowed, false);
  assert.equal(states(g.coordinator)[0], State.UNRESOLVED);
  const h = setup(['audio','unknown','video'], { continueKnownAfterFailure: true }); await h.start(); h.contexts[0].fail();
  assert.equal(await h.start(), false); assert.equal(h.starts(), 1);
});

test('Stop cancels pending start; rescans do not implicitly Resume', async () => {
  const f = setup(['video'], { delayFor: () => 40 }); f.coordinator.startNext(); f.coordinator.stop();
  for (const run of f.time.cancelled) run(); f.time.advance(40); await microtasks(); assert.equal(f.starts(), 0);
  f.coordinator.bind(f.reader.scan(f.document)); assert.equal(f.coordinator.startNext(), false);
  assert.equal(f.coordinator.resume(), true); f.coordinator.startNext(); f.time.advance(40); await microtasks();
  assert.equal(f.starts(), 1); f.coordinator.destroy(); assert.equal(f.cancels(), 1);
  assert.equal(f.contexts[0].done(), false); assert.equal(f.coordinator.resume(), false);
});

test('replaced owner and changed lesson invalidate delayed callbacks and execution contexts', async () => {
  const f = setup(['video'], { delayFor: () => 10 }); f.coordinator.startNext();
  f.owners[0].replaceWith(f.owners[0].cloneNode(true)); f.time.advance(10); await microtasks(); assert.equal(f.starts(), 0);
  const g = setup(); await g.start();
  g.document.querySelector('.posCatalog_active').classList.remove('posCatalog_active');
  g.document.querySelector('#unit-0-1').classList.add('posCatalog_active');
  assert.equal(g.contexts[0].done(), false); assert.equal(g.cancels(), 1);
  assert.equal(g.coordinator.navigationDecision().allowed, false);
});

test('late start promise after replacement cannot mark running or report completion', async () => {
  let resolve, lateCancels = 0;
  const f = setup(['video'], { adapters: { video: { recognize: () => true, start: () => new Promise(r => { resolve = r; }) } } });
  f.coordinator.startNext(); f.time.advance(0); assert.deepEqual(states(f.coordinator), [State.STARTING]);
  f.coordinator.contextChanged(); f.coordinator.bind(f.reader.scan(f.document));
  resolve({ cancel() { lateCancels++; } }); await microtasks();
  assert.equal(lateCancels, 1); assert.deepEqual(states(f.coordinator), [State.PENDING]);
});

test('start rejection never becomes running and an early done callback is rejected', async () => {
  let early;
  const f = setup(['video'], { adapters: { video: { recognize: () => true, start(ctx) { early = ctx.done(); return Promise.reject(Error('simulated')); } } } });
  await f.start(); assert.equal(early, false); assert.deepEqual(states(f.coordinator), [State.UNRESOLVED]);
  assert.equal(f.coordinator.snapshot().records[0].history.includes(State.RUNNING), false);
});

test('fresh platform credit and local end permit one simulated activation and matching acknowledgement', async () => {
  const f = setup(); await f.start(); f.contexts[0].done();
  assert.equal(f.coordinator.navigationDecision().allowed, false); f.markLesson();
  const decision = f.coordinator.navigationDecision(); assert.equal(decision.allowed, true);
  const port = fakePort(f);
  assert.equal(f.coordinator.queueNavigation(decision.permit, port, { delay: 25 }), true);
  assert.equal(f.coordinator.queueNavigation(decision.permit, port), false);
  f.time.advance(25); await microtasks(); assert.equal(port.calls(), 1);
  assert.equal(f.coordinator.snapshot().diagnostic, 'navigation-acknowledged');
  assert.equal(f.coordinator.snapshot().inventory.lesson.id, 'unit-0-1');
  assert.equal(f.coordinator.queueNavigation(decision.permit, port), true);
  f.time.advance(0); await microtasks(); assert.equal(port.calls(), 1);
});

test('permit is short-lived, evidence is re-read, and unrelated markers/zero totals never authorize', async () => {
  const f = setup(); await f.start(); f.contexts[0].done();
  f.markLesson(f.document.querySelector('#unit-0-1')); assert.equal(f.coordinator.navigationDecision().allowed, false);
  f.document.querySelector('.posCatalog_active .jobUnfinishCount').value = '0';
  assert.equal(f.coordinator.navigationDecision().allowed, false);
  f.markLesson(); const first = f.coordinator.navigationDecision().permit, port = fakePort(f);
  f.coordinator.queueNavigation(first, port, { delay: 5000 }); f.time.advance(5000); await microtasks(); assert.equal(port.calls(), 0);
  // A separate context is necessary: the logical navigation action was already consumed.
  f.coordinator.bind(f.reader.scan(f.document)); const second = f.coordinator.navigationDecision('prior-credit').permit;
  f.coordinator.queueNavigation(second, port, { delay: 10 });
  f.document.querySelector('.posCatalog_active .jobUnfinishCount').value = '1';
  f.time.advance(10); await microtasks(); assert.equal(port.calls(), 0);
  assert.equal(evaluateCompletion(f.coordinator.snapshot().inventory).fresh.lesson.credit.status, Credit.CONTRADICTORY);
});

test('prior-credit shortcut does not replay or invent local completion; active/unknown cases deny', async () => {
  const f = setup(); f.markLesson(); assert.equal(await f.start(), false); assert.equal(f.starts(), 0);
  assert.equal(states(f.coordinator)[0], State.PENDING);
  assert.equal(f.coordinator.navigationDecision('prior-credit').allowed, true);
  Object.defineProperty(f.players[0], 'paused', { value: false });
  assert.equal(f.coordinator.navigationDecision('prior-credit').allowed, false);
  const g = setup(['unknown']); g.markLesson(); assert.equal(g.coordinator.navigationDecision('prior-credit').allowed, false);
});

test('optional assessment handoff requires prior chapter credit and next chapter; verification blocks', () => {
  const f = setup([]);
  const first = f.document.querySelector('#unit-0-0'), exam = f.document.querySelector('#unit-0-1');
  first.classList.remove('posCatalog_active'); exam.classList.add('posCatalog_active');
  exam.querySelector('.posCatalog_name').setAttribute('title', '章节测验');
  f.document.querySelector('.prev_title').setAttribute('title', '章节测验');
  f.coordinator.bind(f.reader.scan(f.document)); assert.equal(f.coordinator.navigationDecision('assessment').allowed, false);
  f.markLesson(first); const decision = f.coordinator.navigationDecision('assessment');
  assert.equal(decision.allowed, true); assert.equal(decision.permit.targetKey.includes('unit-1-0'), true);
  assert.equal(exam.querySelector('.icon_Completed'), null);
  f.document.body.insertAdjacentHTML('beforeend', '<form>验证码<input name="captcha"></form>');
  assert.equal(f.coordinator.navigationDecision('assessment').allowed, false);
});

test('stale target, Stop and acknowledgement timeout cannot navigate or acknowledge later', async () => {
  const f = setup(); f.markLesson(); let calls = 0;
  f.coordinator.queueNavigation(f.coordinator.navigationDecision('prior-credit').permit, { activate() { calls++; } }, { delay: 10 });
  f.document.querySelector('#unit-0-1').setAttribute('aria-disabled','true'); f.time.advance(10); await microtasks(); assert.equal(calls, 0);
  const g = setup(); g.markLesson(); const port = fakePort(g);
  g.coordinator.queueNavigation(g.coordinator.navigationDecision('prior-credit').permit, port, { delay: 10 });
  g.coordinator.stop(); g.time.advance(10); assert.equal(port.calls(), 0);
  const h = setup(); h.markLesson(); let resolve;
  h.coordinator.queueNavigation(h.coordinator.navigationDecision('prior-credit').permit, { activate: () => new Promise(r => { resolve = r; }) }, { acknowledgementMs: 100 });
  h.time.advance(0); h.time.advance(100); assert.equal(h.coordinator.snapshot().stopped, true);
  resolve(h.reader.scan(h.document)); await microtasks(); assert.equal(h.coordinator.snapshot().diagnostic, 'navigation-unacknowledged');
});

test('matching acknowledgement is required; forged permits cannot activate', async () => {
  const f = setup(); f.markLesson(); let calls = 0;
  f.coordinator.queueNavigation({ ...f.coordinator.navigationDecision('prior-credit').permit }, { activate() { calls++; } });
  f.time.advance(0); await microtasks(); assert.equal(calls, 0);
  const g = setup(); g.markLesson();
  g.coordinator.queueNavigation(g.coordinator.navigationDecision('prior-credit').permit, { activate: () => g.reader.scan(g.document) });
  g.time.advance(0); await microtasks(); assert.equal(g.coordinator.snapshot().diagnostic, 'navigation-ack-mismatch');
  assert.equal(g.coordinator.snapshot().stopped, true);
});

test('one explicit session owns the page and destroying it permits only a fresh owner', () => {
  const f = page(), options = { clock: clock() };
  const a = acquireSession(f.document, options), b = acquireSession(f.document, { clock: clock() });
  assert.equal(a, b); assert.equal(a.coordinator, b.coordinator);
  a.dispose(); const c = acquireSession(f.document, options); assert.notEqual(c, a);
  assert.equal(a.coordinator.snapshot().stopped, true); c.dispose();
});

test('loading inventory cannot run; an explicitly rescanned ready frame can run once', async () => {
  const f = setup(); const player = f.players[0]; player.remove();
  f.coordinator.bind(f.reader.scan(f.document)); assert.equal(await f.start(), false);
  f.owners[0].contentDocument.body.append(player);
  f.coordinator.bind(f.reader.scan(f.document)); assert.equal(await f.start(), true);
  assert.equal(f.coordinator.startNext(), false); assert.equal(f.starts(), 1);
  // A new runtime has no implicit boot or persisted local-end authority.
  const fresh = createCoordinator({ clock: f.time }); fresh.bind(f.reader.scan(f.document));
  assert.equal(fresh.navigationDecision().allowed, false);
});

test('one independently active later player prevents starting an earlier pending task', async () => {
  const f = setup(['video','audio']);
  Object.defineProperty(f.players[1], 'paused', { value: false });
  assert.equal(await f.start(), false); assert.equal(f.starts(), 0);
  assert.equal(f.coordinator.snapshot().diagnostic, 'independently-active-media');
});

test('task actions are owned by the coordinator and cannot survive completion, Stop or context change', async () => {
  const f = setup(); await f.start(); let calls = 0;
  const context = f.contexts[0];
  assert.equal(context.schedule({ key: 'monitor', delay: 10, execute: () => calls++ }), true);
  assert.equal(context.schedule({ key: 'monitor', delay: 10, execute: () => calls++ }), false);
  f.coordinator.stop(); for (const callback of f.time.cancelled) callback(); f.time.advance(10);
  assert.equal(calls, 0); assert.equal(context.done(), false);
  assert.equal(context.schedule({ key: 'late', delay: 0, execute: () => calls++ }), false);
  const g = setup(); await g.start();
  g.contexts[0].schedule({ key: 'monitor', delay: 10, execute: () => calls++ });
  g.coordinator.contextChanged(); g.time.advance(10); assert.equal(calls, 0);
});
