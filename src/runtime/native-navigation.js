import { inspectInventory } from '../platform/inventory.js';

/** The only catalog effect port. It never constructs URLs or claims click success. */
export function createNativeNavigation(document, reader, currentInventory) {
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
