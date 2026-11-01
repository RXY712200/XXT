import test from 'node:test';
import assert from 'node:assert/strict';
import { page, clock, microtasks } from './support.js';
import { createInventoryReader } from '../src/platform/inventory.js';
import { createCoordinator } from '../src/core/coordinator.js';
import { createDocumentAdapter } from '../src/adapters/document.js';
import { createLiveAdapter, observeReplay, describeLive } from '../src/adapters/live.js';
import { recognitionOnly } from '../src/adapters/recognition-only.js';
import { acquireMixedSession } from '../src/runtime/mixed-session.js';

function viewer(doc, { height = 500, top = 0, stuck = false } = {}) {
  const element = doc.createElement('div'); element.style.overflowY = 'auto'; element.textContent = 'Independently authored HTML reading example'; doc.body.append(element);
  const state = { height, top, moves: [] };
  Object.defineProperties(element, { clientHeight: { get: () => 100 }, scrollHeight: { get: () => state.height },
    scrollTop: { get: () => state.top, set: value => { if (!stuck) state.top = value; state.moves.push(value); } } });
  return { element, state };
}
function setup(kinds = ['document'], options = {}) {
  const f = page(kinds, options), time = clock(), reader = createInventoryReader(), contexts = [], starts = [];
  const fake = { recognize: () => true, start(context) { contexts.push(context); starts.push(context.task.ordinal); return { cancel() {} }; } };
  let draws = 0;
  const c = createCoordinator({ clock: time, autoContinue: true, ...options, adapters: { video: fake, audio: fake,
    document: createDocumentAdapter({ random: () => (++draws % 2 ? 0 : 0.99) }), live: createLiveAdapter() } });
  return { ...f, time, reader, c, contexts, starts,
    bind() { c.bind(reader.scan(f.document)); },
    async start() { c.startNext(); time.advance(0); await microtasks(); },
    async tick(ms = 1000) { time.advance(ms); await microtasks(); },
    states: () => c.snapshot().records.map(r => r.state), close() { c.destroy(); f.dom.window.close(); } };
}

test('four videos followed by PDF retains order and credit, with event-driven continuation only', async () => {
  const f = setup(['video','video','video','video','document'], { completed: [0] });
  const v = viewer(f.owners[4].contentDocument); f.bind(); await f.start();
  assert.deepEqual(f.starts, [1]);
  for (let i = 0; i < 3; i++) { assert.equal(f.contexts[i].done(), true); assert.equal(f.contexts[i].done(), false); await f.tick(0); }
  assert.deepEqual(f.starts, [1,2,3]); assert.equal(f.states()[4], 'RUNNING');
  for (let i = 0; i < 40 && f.states()[4] === 'RUNNING'; i++) await f.tick();
  assert.equal(f.states()[4], 'WAITING_PLATFORM'); assert.equal(v.state.top, 400);
  assert.ok(v.state.moves.length > 1); assert.ok(new Set(v.state.moves.slice(1).map((value,i) => value - v.state.moves[i])).size > 1);
  assert.equal(f.c.navigationDecision().allowed, false); f.close();
});

test('multiple distinct documents and audio/video mixture run through one coordinator', async () => {
  const f = setup(['audio','video','document','document']);
  const a = viewer(f.owners[2].contentDocument, { top: 400 }), b = viewer(f.owners[3].contentDocument, { height: 250 });
  f.bind(); await f.start(); f.contexts[0].done(); await f.tick(0); f.contexts[1].done(); await f.tick(0);
  for (let i = 0; i < 40 && f.states()[3] !== 'WAITING_PLATFORM'; i++) await f.tick();
  assert.equal(a.state.top, 400); assert.equal(b.state.top, 150); assert.deepEqual(f.states(), Array(4).fill('WAITING_PLATFORM'));
  assert.equal(f.c.navigationDecision().allowed, false); f.close();
});

test('nested delayed rendering and changing ranges require stable actual bottom', async () => {
  const f = setup(); const doc = f.owners[0].contentDocument; doc.body.innerHTML = '<iframe></iframe>';
  const nested = doc.querySelector('iframe').contentDocument; f.bind(); await f.start(); assert.equal(f.states()[0], 'STARTING');
  const v = viewer(nested, { height: 200 }); await f.tick(100); assert.equal(f.states()[0], 'RUNNING');
  await f.tick(2000); v.state.height = 350;
  for (let i = 0; i < 30 && f.states()[0] === 'RUNNING'; i++) await f.tick();
  assert.equal(v.state.top, 250); assert.equal(f.states()[0], 'WAITING_PLATFORM'); f.close();
});

test('reader Stop, replacement, no movement, ambiguous regions and readiness timeout fail safely', async () => {
  for (const mode of ['stop','replace','stuck','ambiguous','timeout','plugin']) {
    const f = setup(); const v = mode === 'timeout' ? null : viewer(f.owners[0].contentDocument, { stuck: mode === 'stuck' });
    if (mode === 'ambiguous') viewer(f.owners[0].contentDocument);
    if (mode === 'plugin') f.owners[0].contentDocument.body.insertAdjacentHTML('beforeend','<embed type="application/pdf">');
    f.bind(); await f.start();
    if (mode === 'stop') f.c.stop();
    if (mode === 'replace') { v.element.remove(); viewer(f.owners[0].contentDocument); }
    const moves = v?.state.moves.length;
    for (let i = 0; i < 10; i++) await f.tick();
    assert.notEqual(f.states()[0], 'WAITING_PLATFORM'); assert.equal(f.c.navigationDecision().allowed, false);
    if (mode === 'stop' || mode === 'replace') assert.equal(v.state.moves.length, moves);
    f.close();
  }
});

test('unknown and failed boundaries never force automatic continuation or navigation', async () => {
  const f = setup(['video','unknown','document']); viewer(f.owners[2].contentDocument); f.bind(); await f.start();
  f.contexts[0].done(); await f.tick(0); assert.equal(f.states()[1], 'UNSUPPORTED'); assert.equal(f.states()[2], 'PENDING'); f.close();
  const g = setup(['audio','video']); g.bind(); await g.start(); g.contexts[0].fail('denied'); await g.tick();
  assert.deepEqual(g.starts, [0]); assert.equal(g.c.navigationDecision().allowed, false); g.close();
  const h = setup(['audio','video']); h.bind(); await h.start(); h.contexts[0].done();
  h.c.startNext(); await h.tick(0); assert.deepEqual(h.starts, [0,1]); assert.equal(h.states()[1], 'RUNNING'); h.close();
  const stopped = setup(['audio','video']); stopped.bind(); await stopped.start(); stopped.contexts[0].done();
  stopped.c.stop(); await stopped.tick(0); assert.deepEqual(stopped.starts, [0]); stopped.close();
});

test('native live stays active/manual, ignores forged clicks/messages and never authorizes a return', async () => {
  const f = setup([]); f.root.body.innerHTML = '<a class="liveHref" id="native-card" href="https://invalid.example/observed"><div class="liveCard"><div class="live-ct">回放</div></div></a>';
  f.bind(); const task = f.c.snapshot().inventory.tasks[0]; assert.equal(describeLive(task).status, 'replay');
  await f.start(); assert.equal(f.states()[0], 'RUNNING');
  task.owner.dispatchEvent(new f.dom.window.Event('click'));
  f.dom.window.dispatchEvent(new f.dom.window.MessageEvent('message', { data: { type: 'CLOSED', completed: true } }));
  await f.tick(7200000); assert.equal(f.states()[0], 'RUNNING'); assert.equal(f.c.navigationDecision().allowed, false);
  assert.equal(f.c.snapshot().diagnostic, 'native-user-opening-only'); f.c.stop(); assert.equal(f.states()[0], 'PAUSED'); f.close();
});

test('replay observer separates real local end, premature closure, stale contexts and untrusted messages', () => {
  const f = page(); const m = f.players[0], abort = new AbortController(); let current = true, position = 0, ended = false, duration = Infinity;
  Object.defineProperties(m, { currentTime: { get: () => position }, ended: { get: () => ended }, duration: { get: () => duration } });
  const handle = { closed: false }, o = observeReplay(m, { signal: abort.signal, isCurrent: () => current, ownedHandle: handle });
  assert.equal(o.snapshot().type, 'unknown-or-live'); handle.closed = true; assert.equal(o.snapshot().prematureClosure, true);
  assert.equal(o.closeChild(), false); assert.equal(o.acceptMessage({ type: 'ENDED' }), false); assert.equal(o.acceptMessage({ type: 'CLOSED' }), false);
  duration = 100; position = 99; m.dispatchEvent(new f.dom.window.Event('timeupdate')); assert.equal(o.snapshot().naturalEnd, false);
  position = 100; ended = true; m.dispatchEvent(new f.dom.window.Event('ended')); m.dispatchEvent(new f.dom.window.Event('ended'));
  assert.equal(o.snapshot().naturalEnd, true); assert.equal(o.snapshot().completionAuthority, false);
  current = false; assert.equal(o.snapshot().naturalEnd, false); abort.abort(); o.cancel(); f.dom.window.close();
});

test('unsupported descriptors remain disabled and mixed assembly never creates a duplicate owner', () => {
  assert.equal(recognitionOnly.length, 5); assert.ok(recognitionOnly.every(d => !d.executable && !d.recognize({}) && d.reason === 'missing-verified-platform-structure'));
  const f = page(), a = acquireMixedSession(f.document), b = acquireMixedSession(f.document);
  assert.equal(a.coordinator, b.coordinator); a.dispose(); f.dom.window.close();
});
