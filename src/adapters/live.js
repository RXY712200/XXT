import { captureMediaSource, matchesMediaSource } from '../platform/media-source.js';

export function describeLive(task) {
  const entry = task.owner;
  if (task.kind !== 'live' || task.identity !== 'verified' || !entry.isConnected || !entry.matches('a.liveHref') || !entry.querySelector('.liveCard .live-ct')) return null;
  const label = entry.textContent.trim();
  const status = /未开始|预约/.test(label) ? 'scheduled' : /直播中/.test(label) ? 'ongoing' : /回放/.test(label) ? 'replay' : /加载|不可用/.test(label) ? 'unavailable' : 'unknown';
  let destination = null; try { const url = new URL(entry.getAttribute('href'), entry.baseURI); if (['http:','https:'].includes(url.protocol) && entry.hasAttribute('href')) destination = url.href; } catch { /* Do not guess. */ }
  return Object.freeze({ status, destination, reason: destination ? 'native-user-opening-only' : 'native-destination-unverified' });
}

/** Observe the original entry; never invoke its handler or infer popup success. */
export function createLiveAdapter() {
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
export function observeReplay(media, { signal, isCurrent, ownedHandle = null }) {
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
