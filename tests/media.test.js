import test from 'node:test';
import assert from 'node:assert/strict';
import { page, clock, microtasks } from './support.js';
import { createInventoryReader } from '../src/platform/inventory.js';
import { createCoordinator } from '../src/core/coordinator.js';
import { createVideoAdapter } from '../src/adapters/video.js';
import { createAudioAdapter } from '../src/adapters/audio.js';

// Controlled state on genuine jsdom elements; play/event behavior is simulated.
function fixture(kinds = ['video'], options = {}) {
  const f = page(kinds), time = clock(), reader = createInventoryReader(), controls = [];
  for (const media of f.players.filter(Boolean)) {
    const state = { paused: true, ended: false, readyState: 4, error: null, currentTime: 0, calls: 0, pauses: 0, behavior: null };
    for (const key of ['paused','ended','readyState','error','currentTime']) Object.defineProperty(media, key, { configurable: true, get: () => state[key] });
    media.play = () => { state.calls++; if (state.behavior) return state.behavior(media, state); state.paused = false; return Promise.resolve(); };
    media.pause = () => { state.paused = true; state.pauses++; media.dispatchEvent(new media.ownerDocument.defaultView.Event('pause')); };
    state.event = name => media.dispatchEvent(new media.ownerDocument.defaultView.Event(name));
    controls.push(state);
  }
  const coordinator = createCoordinator({ clock: time, adapters: { video: createVideoAdapter(options.video), audio: createAudioAdapter(options.audio) },
    continueKnownAfterFailure: options.continueKnownAfterFailure });
  coordinator.bind(reader.scan(f.document));
  return { ...f, time, reader, controls, coordinator,
    async start() { coordinator.startNext(); time.advance(0); await microtasks(); },
    async tick(ms) { time.advance(ms); await microtasks(); },
    state: () => coordinator.snapshot().records.map(r => r.state),
    close() { coordinator.destroy(); f.dom.window.close(); } };
}
const denied = () => Object.assign(Error('simulated policy'), { name: 'NotAllowedError' });

test('video start, rate correction, natural end dedup and independent platform credit', async () => {
  const f = fixture(); await f.start(); assert.deepEqual(f.state(), ['RUNNING']);
  f.players[0].playbackRate = 2; f.controls[0].event('ratechange'); assert.equal(f.players[0].playbackRate, 1);
  f.controls[0].ended = true; f.controls[0].event('ended'); f.controls[0].event('ended');
  assert.deepEqual(f.state(), ['WAITING_PLATFORM']); assert.equal(f.coordinator.navigationDecision().allowed, false);
  f.markLesson(); assert.equal(f.coordinator.navigationDecision().allowed, true);
  assert.equal(f.time.timers.size, 0); f.close();
});

test('healthy background/focus/visibility/mouse-leave events never restart playback', async () => {
  const f = fixture(); await f.start(); const win = f.players[0].ownerDocument.defaultView, doc = win.document;
  for (const name of ['blur','focus']) win.dispatchEvent(new win.Event(name));
  for (const name of ['visibilitychange','mouseleave']) doc.dispatchEvent(new win.Event(name));
  for (const name of ['blur','focus']) f.dom.window.dispatchEvent(new f.dom.window.Event(name));
  for (let i = 0; i < 20; i++) { f.controls[0].currentTime++; f.controls[0].event('timeupdate'); await f.tick(1000); }
  assert.equal(f.controls[0].calls, 1); assert.equal(f.players[0].playbackRate, 1); f.close();
});

test('pause recovery is immediate, deduplicated, cooldown-limited and budgeted', async () => {
  const f = fixture(); await f.start(); const s = f.controls[0]; s.paused = true; s.event('pause'); await microtasks();
  assert.equal(s.calls, 2); s.paused = true; s.event('pause'); await microtasks(); assert.equal(s.calls, 2);
  await f.tick(3000); assert.equal(s.calls, 3); s.paused = true;
  await f.tick(3000); assert.equal(s.calls, 4); s.paused = true;
  await f.tick(3000); assert.deepEqual(f.state(), ['UNRESOLVED']); assert.equal(s.calls, 4); f.close();
});

test('stalled playback uses observed lack of progress and never seeks', async () => {
  const f = fixture(); await f.start(); await f.tick(7000); assert.equal(f.controls[0].calls, 1);
  await f.tick(1000); assert.equal(f.controls[0].calls, 2); assert.equal(f.controls[0].currentTime, 0); f.close();
});

test('video policy rejection uses one muted fallback without later automatic unmute', async () => {
  const f = fixture(); const s = f.controls[0];
  s.behavior = (m, state) => { if (state.calls === 1) return Promise.reject(denied()); state.paused = false; return Promise.resolve(); };
  await f.start(); assert.deepEqual(f.state(), ['RUNNING']); assert.equal(s.calls, 2); assert.equal(f.players[0].muted, true);
  s.paused = true; s.event('pause'); await microtasks(); assert.equal(f.players[0].muted, true); f.close();
});

test('audio audible success and policy fallback preserve 1.0x', async () => {
  const a = fixture(['audio']); await a.start(); assert.equal(a.players[0].muted, false); assert.equal(a.controls[0].calls, 1);
  a.controls[0].ended = true; a.controls[0].event('ended'); assert.deepEqual(a.state(), ['WAITING_PLATFORM']);
  assert.equal(a.coordinator.navigationDecision().allowed, false); a.close();
  const b = fixture(['audio']); b.controls[0].behavior = (m, s) => {
    if (!m.muted) return Promise.reject(denied()); s.paused = false; return Promise.resolve();
  };
  await b.start(); assert.deepEqual(b.state(), ['RUNNING']); assert.equal(b.controls[0].calls, 2);
  assert.equal(b.players[0].muted, true); assert.equal(b.players[0].playbackRate, 1); b.close();
});

test('dual audio denial and synchronous unsupported failure remain unresolved, with no loops', async () => {
  const f = fixture(['audio']); f.controls[0].behavior = () => Promise.reject(denied());
  await f.start(); await f.tick(10000); assert.equal(f.controls[0].calls, 2); assert.deepEqual(f.state(), ['UNRESOLVED']);
  assert.equal(f.coordinator.navigationDecision().allowed, false); assert.equal(f.time.timers.size, 0); f.close();
  const g = fixture(['audio']); g.controls[0].behavior = () => { throw Object.assign(Error('unsupported'), { name: 'NotSupportedError' }); };
  await g.start(); assert.deepEqual(g.state(), ['UNRESOLVED']); assert.equal(g.controls[0].calls, 1); g.close();
  const h = fixture(['audio']); await h.start(); h.controls[0].error = { code: 3 }; h.controls[0].event('error');
  assert.notDeepEqual(h.state(), ['RUNNING']); assert.equal(h.coordinator.navigationDecision().allowed, false); h.close();
});

test('source-present delayed play settlement and transient AbortError have bounded startup recovery', async () => {
  const f = fixture(['audio']); let resolve;
  f.controls[0].readyState = 0; f.controls[0].behavior = () => new Promise(r => { resolve = r; });
  await f.start(); assert.deepEqual(f.state(), ['STARTING']);
  await f.tick(1000); assert.equal(f.controls[0].calls, 1); f.controls[0].readyState = 4; f.controls[0].paused = false; resolve();
  await microtasks(); assert.deepEqual(f.state(), ['RUNNING']); f.close();
  const g = fixture(['audio']); g.controls[0].behavior = (m,s) => {
    if (s.calls === 1) return Promise.reject(Object.assign(Error('loading'), { name: 'AbortError' }));
    s.paused = false; return Promise.resolve();
  };
  await g.start(); await g.tick(250); assert.deepEqual(g.state(), ['RUNNING']); assert.equal(g.controls[0].calls, 2); g.close();
});

test('audio readiness and hung play promises time out without running or completion', async () => {
  const f = fixture(['audio']); f.controls[0].readyState = 0; f.players[0].removeAttribute('src');
  f.coordinator.bind(f.reader.scan(f.document)); await f.start(); await f.tick(5000);
  assert.deepEqual(f.state(), ['UNRESOLVED']); assert.equal(f.controls[0].calls, 0); f.close();
  const g = fixture(['audio']); g.controls[0].behavior = () => new Promise(() => {}); await g.start(); await g.tick(5000);
  assert.deepEqual(g.state(), ['UNRESOLVED']); assert.equal(g.time.timers.size, 0); g.close();
});

test('early genuine end is buffered across fulfilled STARTING handshake only', async () => {
  const f = fixture(); f.controls[0].behavior = (m,s) => {
    s.paused = false; s.ended = true; s.event('ended'); return Promise.resolve();
  };
  await f.start(); assert.deepEqual(f.state(), ['WAITING_PLATFORM']);
  assert.equal(f.coordinator.snapshot().records[0].history.filter(s => s === 'LOCAL_COMPLETED').length, 1); f.close();
  const g = fixture(); g.controls[0].behavior = (m,s) => { s.ended = true; s.event('ended'); return Promise.reject(denied()); };
  await g.start(); await g.tick(5000); assert.notDeepEqual(g.state(), ['WAITING_PLATFORM']); g.close();
});

test('Stop during pending play and recovery removes listeners/actions; late events have no authority', async () => {
  const f = fixture(); let resolve;
  f.controls[0].behavior = () => new Promise(r => { resolve = r; }); await f.start();
  f.coordinator.stop(); resolve(); await microtasks(); f.controls[0].event('pause'); f.controls[0].ended = true; f.controls[0].event('ended');
  await f.tick(10000); assert.deepEqual(f.state(), ['PAUSED']); assert.equal(f.controls[0].calls, 1); assert.equal(f.time.timers.size, 0); f.close();
  const g = fixture(); await g.start(); g.controls[0].behavior = () => new Promise(r => { resolve = r; });
  g.controls[0].paused = true; g.controls[0].event('pause'); g.coordinator.stop(); resolve(); await microtasks();
  assert.deepEqual(g.state(), ['PAUSED']); assert.equal(g.time.timers.size, 0); g.close();
});

test('replaced source/owner and changed lesson invalidate effects before any recovery', async () => {
  for (const change of [f => f.players[0].setAttribute('src','replacement'), f => f.owners[0].remove(),
    f => { f.document.querySelector('.posCatalog_active').classList.remove('posCatalog_active'); f.document.querySelector('#unit-0-1').classList.add('posCatalog_active'); }]) {
    const f = fixture(); await f.start(); change(f); await f.tick(1000);
    assert.equal(f.controls[0].calls, 1); assert.notDeepEqual(f.state(), ['RUNNING']); f.close();
  }
  const f = fixture(); Object.defineProperty(f.players[0], 'currentSrc', { value: f.players[0].getAttribute('src') });
  f.coordinator.bind(f.reader.scan(f.document)); await f.start(); f.players[0].setAttribute('src','new-source-still-loading');
  await f.tick(1000); assert.notDeepEqual(f.state(), ['RUNNING']); assert.equal(f.controls[0].calls, 1); f.close();
});

test('failed audio follows accepted same-lesson policy, never crosses unknown boundaries', async () => {
  for (const next of ['video','unknown']) {
    const f = fixture(['audio',next], { continueKnownAfterFailure: true }); f.controls[0].behavior = () => Promise.reject(denied());
    await f.start(); await f.start();
    assert.equal(f.state()[0], 'UNRESOLVED'); assert.equal(f.state()[1], next === 'video' ? 'RUNNING' : 'UNSUPPORTED');
    f.markLesson(); assert.equal(f.coordinator.navigationDecision().allowed, false); f.close();
  }
});

test('independent controls, competing active media and inactive preview behavior', async () => {
  const f = fixture(['video','audio'], { audio: { enabled: false } }); await f.start(); assert.equal(f.controls[0].calls, 1);
  f.controls[0].ended = true; f.controls[0].event('ended'); await f.start(); assert.equal(f.controls[1].calls, 0); f.close();
  const g = fixture(['audio','video']); g.controls[1].paused = false; await g.start(); assert.equal(g.controls[0].calls, 0); g.close();
  const h = fixture(['audio']); h.root.body.insertAdjacentHTML('beforeend','<audio id="auditionAudio"></audio>');
  h.coordinator.bind(h.reader.scan(h.document)); await h.start(); assert.deepEqual(h.state(), ['RUNNING']); h.close();
});

test('missing audio creation is bounded and may only adopt the same verified task owner', async () => {
  const f = fixture(['audio']); const media = f.players[0]; media.remove(); f.coordinator.bind(f.reader.scan(f.document));
  assert.equal(f.coordinator.waitForMedia(() => f.reader.scan(f.document)), true);
  assert.equal(f.coordinator.waitForMedia(() => f.reader.scan(f.document)), false);
  await f.tick(1000); f.owners[0].contentDocument.body.append(media); await f.tick(100); await f.tick(0);
  assert.deepEqual(f.state(), ['RUNNING']); f.close();
  const g = fixture(['audio']); g.players[0].remove(); g.coordinator.bind(g.reader.scan(g.document));
  g.coordinator.waitForMedia(() => g.reader.scan(g.document)); await g.tick(5000);
  assert.equal(g.coordinator.snapshot().diagnostic, 'media-readiness-timeout'); assert.equal(g.controls[0].calls, 0); g.close();
});

test('readiness adoption rejects changed owners and Stop; pre-start ended cannot leave STARTING stuck', async () => {
  const f = fixture(['audio']); f.players[0].remove(); f.coordinator.bind(f.reader.scan(f.document));
  f.coordinator.waitForMedia(() => f.reader.scan(f.document)); f.owners[0].id = 'different-owner'; await f.tick(100);
  assert.equal(f.controls[0].calls, 0); assert.equal(f.coordinator.snapshot().diagnostic, 'readiness-context-changed'); f.close();
  const g = fixture(['audio']); g.players[0].remove(); g.coordinator.bind(g.reader.scan(g.document));
  g.coordinator.waitForMedia(() => g.reader.scan(g.document)); g.coordinator.stop(); await g.tick(5000);
  assert.equal(g.controls[0].calls, 0); assert.equal(g.time.timers.size, 0); g.close();
  const h = fixture(['audio']); h.controls[0].readyState = 0; h.players[0].removeAttribute('src');
  h.coordinator.bind(h.reader.scan(h.document)); await h.start(); h.controls[0].ended = true;
  h.controls[0].event('ended'); await h.tick(100); assert.deepEqual(h.state(), ['UNRESOLVED']); h.close();
});

test('background switch disables recovery without disabling independent media speed/ownership guards', async () => {
  const f = fixture(['audio'], { audio: { background: false } }); await f.start();
  f.controls[0].paused = true; f.controls[0].event('pause'); await f.tick(10000);
  assert.equal(f.controls[0].calls, 1); f.players[0].playbackRate = 1.5; f.controls[0].event('ratechange');
  assert.equal(f.players[0].playbackRate, 1); f.close();
});

test('source-present preload-none video starts at readyState zero; audio retains policy fallback', async () => {
  const f = fixture(); f.players[0].preload = 'none'; f.controls[0].readyState = 0;
  await f.start(); assert.equal(f.controls[0].calls, 1); assert.deepEqual(f.state(), ['RUNNING']); f.close();
  const g = fixture(['audio']); g.players[0].preload = 'none'; g.controls[0].readyState = 0;
  g.controls[0].behavior = (media, state) => {
    if (!media.muted) return Promise.reject(denied()); state.paused = false; return Promise.resolve();
  };
  await g.start(); assert.equal(g.controls[0].calls, 2); assert.equal(g.players[0].muted, true);
  assert.deepEqual(g.state(), ['RUNNING']); assert.equal(g.players[0].playbackRate, 1); g.close();
});

test('declared child source may become currentSrc without changing inventory revision or ownership', async () => {
  for (const kind of ['video','audio']) {
    const f = fixture([kind]), media = f.players[0], url = 'https://invalid.example/declared-track'; let selected = '';
    media.removeAttribute('src'); media.innerHTML = `<source src="${url}">`;
    Object.defineProperty(media, 'currentSrc', { get: () => selected }); f.controls[0].readyState = 0;
    f.coordinator.bind(f.reader.scan(f.document)); const revision = f.coordinator.snapshot().inventory.revision;
    f.controls[0].behavior = (m,s) => { selected = url; s.paused = false; return Promise.resolve(); };
    await f.start(); assert.deepEqual(f.state(), ['RUNNING']); assert.equal(f.coordinator.snapshot().inventory.revision, revision);
    f.controls[0].ended = true; f.controls[0].event('ended'); assert.deepEqual(f.state(), ['WAITING_PLATFORM']);
    assert.equal(f.coordinator.navigationDecision().allowed, false); f.close();
  }
});

test('ambiguous declarations never grant playback; child replacement and undeclared currentSrc invalidate', async () => {
  const f = fixture(); const media = f.players[0]; media.removeAttribute('src');
  media.innerHTML = '<source src="https://invalid.example/a"><source src="https://invalid.example/b">';
  f.coordinator.bind(f.reader.scan(f.document)); await f.start(); await f.tick(5000);
  assert.equal(f.controls[0].calls, 0); assert.deepEqual(f.state(), ['UNRESOLVED']); f.close();
  for (const replaceNode of [false,true]) {
    const g = fixture(); let selected = ''; const m = g.players[0], url = 'https://invalid.example/a';
    m.removeAttribute('src'); m.innerHTML = `<source src="${url}">`; Object.defineProperty(m,'currentSrc',{get:()=>selected});
    g.coordinator.bind(g.reader.scan(g.document)); await g.start(); const pauses = g.controls[0].pauses;
    if (replaceNode) m.firstChild.replaceWith(m.firstChild.cloneNode()); else selected = 'https://invalid.example/unapproved';
    await g.tick(1000); assert.notDeepEqual(g.state(), ['RUNNING']); assert.equal(g.controls[0].calls, 1);
    assert.equal(g.controls[0].pauses, pauses); g.close();
  }
});

test('Stop during declared source selection cancels playback authority and owned media after resolution', async () => {
  const f = fixture(); let selected = '', resolve;
  const m = f.players[0], url = 'https://invalid.example/owned'; m.removeAttribute('src'); m.innerHTML = `<source src="${url}">`;
  Object.defineProperty(m,'currentSrc',{get:()=>selected}); f.coordinator.bind(f.reader.scan(f.document));
  f.controls[0].behavior = (m,s) => { selected = url; s.paused = false; return new Promise(r => { resolve = r; }); };
  await f.start(); f.coordinator.stop(); assert.equal(f.controls[0].paused, true);
  resolve(); await microtasks(); f.controls[0].ended = true; f.controls[0].event('ended');
  assert.deepEqual(f.state(), ['PAUSED']); assert.equal(f.time.timers.size, 0); f.close();
});

test('three thousand healthy monitor ticks keep one scheduler record and cancellation remains final', async () => {
  const f = fixture(); await f.start(); const bound = f.coordinator.actions().length;
  for (let i = 0; i < 3000; i++) { f.controls[0].currentTime++; await f.tick(1000); }
  assert.equal(f.coordinator.actions().length, bound); assert.equal(f.controls[0].calls, 1);
  assert.equal(f.coordinator.actions().filter(a => a.status === 'pending').length, 1);
  f.coordinator.stop(); const calls = f.controls[0].calls;
  for (const callback of f.time.cancelled) callback(); await f.tick(1000);
  assert.equal(f.controls[0].calls, calls); assert.equal(f.time.timers.size, 0); f.close();
});
