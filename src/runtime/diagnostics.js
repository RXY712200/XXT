const categories = new Set(['recognition','selection','outcome','recovery','manual','credit','navigation','stop','settings','storage']);
const kinds = new Set(['video','audio','document','live','assessment','unknown']);
const states = new Set(['DISCOVERED','PENDING','READY','STARTING','RUNNING','LOCAL_COMPLETED','WAITING_PLATFORM','FAILED','UNRESOLVED','UNSUPPORTED','PAUSED','CANCELLED']);
export function createDiagnostics() {
  let rows = [];
  return Object.freeze({ add(category, state, kind) {
    if (!categories.has(category)) return;
    rows.push(Object.freeze({ category, state: states.has(state) ? state : 'OTHER', kind: kinds.has(kind) ? kind : 'unknown' }));
    rows = rows.slice(-100);
  }, export: () => JSON.stringify({ format: 'xxt-diagnostics-v1', events: rows }), clear() { rows = []; } });
}
