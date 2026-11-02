import { inspectInventory } from '../platform/inventory.js';

/** The only catalog effect port. It never constructs URLs or claims click success. */
export function createNativeNavigation(document, reader, currentInventory) {
  return Object.freeze({ activate(authorization, { signal, onStage=()=>{}, observe }) {
    const emit=(stage,reason='none')=>{try{onStage(stage,reason);}catch{/* Read-only observation. */}};
    const previous = currentInventory(), fresh = inspectInventory(previous), original = authorization.target;
    const target=fresh.catalog.find(item=>item.key===authorization.targetKey);
    if (!fresh.valid || fresh.courseKey !== authorization.courseKey || fresh.lesson.key !== authorization.lessonKey ||
      !target || !target.node.isConnected || target.node.ownerDocument !== document || target.restricted ||
      target.key!==original?.key || target.title!==original.title || target.chapterKey!==original.chapterKey || JSON.stringify(target.ancestry)!==JSON.stringify(original.ancestry) ||
      (target.node!==original.node && original.node.isConnected) || fresh.catalog.filter(item=>item.key===target.key).length!==1) {
      emit('failed','native-target-invalid');throw Error('native-target-invalid');
    }
    const oldDocuments = fresh.documents, oldTasks = fresh.tasks;
    const topology=snapshot=>JSON.stringify([snapshot.chapters.map(item=>[item.key,item.title]),snapshot.catalog.map(item=>[item.key,item.title,item.chapterKey,item.ancestry,item.restricted])]);
    const expectedTopology=topology(fresh);
    return new Promise((resolve, reject) => {
      const observer = new document.defaultView.MutationObserver(check), watched = new Set();
      let settled=false,cancelPoll,activeSeen=false,contentSeen=false;
      function cleanup() { observer.disconnect();cancelPoll?.();for(const doc of watched)doc.removeEventListener('load',check,true);signal.removeEventListener('abort', abort); }
      function fail(code){if(settled)return;settled=true;cleanup();emit('failed',code);reject(Error(code));}
      function abort() { if(settled)return;settled=true;cleanup();emit('cancelled','native-navigation-cancelled');reject(Error('native-navigation-cancelled')); }
      function check() {
        if(settled)return;
        if (signal.aborted) { abort(); return; }
        const next = reader.scan(document), evidence = inspectInventory(next);
        for (const doc of [document, ...evidence.documents]) if (!watched.has(doc)) { watched.add(doc);doc.addEventListener('load',check,true);observer.observe(doc, { subtree: true, childList: true, attributes: true }); }
        if(evidence.courseKey&&evidence.courseKey!==authorization.courseKey){fail('destination-mismatch');return;}
        if(evidence.status==='unsafe'||evidence.status==='unsupported'){fail('destination-unsafe');return;}
        if(evidence.status==='verified'&&topology(evidence)!==expectedTopology){fail('catalog-mismatch');return;}
        if(evidence.valid&&evidence.lesson.key!==authorization.lessonKey&&evidence.lesson.key!==authorization.targetKey){fail('destination-mismatch');return;}
        const changed = evidence.documents.some(doc => !oldDocuments.includes(doc)) || evidence.tasks.some(task =>
          !oldTasks.some(old => old.owner === task.owner && old.player === task.player && old.source === task.source));
        if(evidence.lesson?.key===authorization.targetKey&&!activeSeen){activeSeen=true;emit('destination-active');}
        if(changed&&evidence.valid&&!contentSeen){contentSeen=true;emit('destination-content',activeSeen?'none':'awaiting-target');}
        if (evidence.valid && evidence.courseKey === authorization.courseKey && evidence.lesson.key === authorization.targetKey && changed) {
          settled=true;cleanup(); resolve(next);
        }
      }
      if (signal.aborted) { abort(); return; }
      signal.addEventListener('abort', abort);
      watched.add(document);document.addEventListener('load',check,true);observer.observe(document, { subtree: true, childList: true, attributes: true });
      cancelPoll=observe?.(check); // Same coordinator scheduler, no timer in the port.
      emit('native-activation');
      try { target.node.click();emit('native-returned');check(); } catch { fail('native-activation-threw'); }
    });
  } });
}
