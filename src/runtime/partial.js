// Adapted user-developed partial-session contract (4cd9f48/e2d33dc/be35bec):
// stable ordered content scope, explicit deferral, no platform-credit authority.
export function createPartialStore(storage) {
  const key='xxt.partial-session.v1';let state=null;
  function scope(inventory){return JSON.stringify([inventory.courseKey,inventory.lesson?.key,inventory.tasks.map(t=>[t.key,t.kind,t.ownerKey,t.mediaSource?.identity||null])]);}
  function save(next=state){if(next.ended.length+next.deferred.length>2048)throw Error('partial-capacity');storage.setItem(key,JSON.stringify(next));state=next;}
  function bind(inventory,{recheck=false}={}){
    const current=scope(inventory);const raw=storage.getItem(key);state=raw?JSON.parse(raw):null;
    if(state && (state.version!==1||typeof state.scope!=='string'||!Array.isArray(state.ended)||!Array.isArray(state.deferred)||state.ended.length+state.deferred.length>2048||[...state.ended,...state.deferred].some(x=>typeof x!=='string')||new Set(state.ended).size!==state.ended.length||new Set(state.deferred).size!==state.deferred.length))throw Error('invalid-partial-state');
    if(state){const stored=JSON.parse(state.scope);if(!Array.isArray(stored)||stored.length!==3||!stored[0]||!stored[1]||!Array.isArray(stored[2])||stored[2].some(t=>!Array.isArray(t)||t.length!==4))throw Error('invalid-partial-scope');}
    if(state?.scope!==current){
      const old=state&&JSON.parse(state.scope),fresh=JSON.parse(current);
      const sameLesson=old&&JSON.stringify(old.slice(0,2))===JSON.stringify(fresh.slice(0,2));
      if(sameLesson&&!recheck&&(state.ended.length||state.deferred.length||old[2].some(t=>t[1]==='unknown')))throw Error('partial-scope-changed');
      const unchanged=sameLesson?fresh[2].filter(task=>old[2].some(previous=>JSON.stringify(previous)===JSON.stringify(task))).map(task=>task[0]):[];
      state={version:1,scope:current,ended:state?.ended.filter(k=>unchanged.includes(k))||[],deferred:state?.deferred.filter(k=>unchanged.includes(k))||[]};save();
    }
    return {ended:[...state.ended],deferred:[...state.deferred]};
  }
  return Object.freeze({bind,record(task){if(!state)return;if(!state.ended.includes(task.key))save({...state,ended:[...state.ended,task.key]});},
    defer(inventory,keys=inventory.tasks.filter(t=>t.kind==='unknown').map(t=>t.key)){
      const unknown=inventory.tasks.filter(t=>t.kind==='unknown').map(t=>t.key);
      if(!state||state.scope!==scope(inventory)||JSON.stringify(keys)!==JSON.stringify(unknown))throw Error('partial-scope-changed');
      const next={...state,deferred:[...new Set([...state.deferred,...keys])]};
      save(next); // No in-memory change before the durable write succeeds.
      return {ended:[...next.ended],deferred:[...next.deferred]};
    }});
}
