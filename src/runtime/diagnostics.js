const categories = new Set(['recognition','selection','outcome','recovery','manual','credit','navigation','stop','settings','storage']);
const kinds = new Set(['video','audio','document','live','assessment','unknown']);
const states = new Set(['DISCOVERED','PENDING','READY','STARTING','RUNNING','LOCAL_COMPLETED','WAITING_PLATFORM','FAILED','UNRESOLVED','UNSUPPORTED','PAUSED','CANCELLED']);
export function createDiagnostics(storage) {
  let rows = [];
  const key='xxt.decisions.v1';
  const safe = row => row && categories.has(row.category) && (states.has(row.state)||row.state==='OTHER') && kinds.has(row.kind) && Object.keys(row).every(k=>['category','state','kind'].includes(k));
  try { const saved=JSON.parse(storage?.getItem(key)||'[]');if(Array.isArray(saved)&&saved.length<=100&&saved.every(safe))rows=saved.map(row=>Object.freeze({...row})); } catch { /* Diagnostics never grant execution authority. */ }
  function persist(){try{storage?.setItem(key,JSON.stringify(rows));}catch{/* Optional journal must not change completion or Stop. */}}
  return Object.freeze({ add(category, state, kind) {
    if (!categories.has(category)) return;
    rows.push(Object.freeze({ category, state: states.has(state) ? state : 'OTHER', kind: kinds.has(kind) ? kind : 'unknown' }));
    rows = rows.slice(-100);
    persist();
  }, export: () => JSON.stringify({ format: 'xxt-diagnostics-v1', events: rows }), clear() { rows = [];persist(); } });
}
