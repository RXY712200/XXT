/** Native accessible HTML viewer geometry only; no guessed PDF-plugin selectors. */
export function locateReader(task) {
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

export function createDocumentAdapter({ enabled = true, random = Math.random } = {}) {
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
