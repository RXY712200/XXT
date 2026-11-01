import { captureMediaSource, matchesMediaSource } from '../platform/media-source.js';
/** Native media effects only. Scheduling and authority remain with the coordinator. */
export function startMedia(context, kind, { background = true } = {}) {
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
    recoveries++; lastRecovery = time; attempt();
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
