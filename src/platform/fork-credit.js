// Reused user-added catalog.status implementation, interface extracted from
// RXY712200/xuexitongScript v3_optimized.js @ 351c08dc4d772908c3d098e8c9160be434bf1064.
// Absent from pinned upstream 9a23b357875a72ed9bfd9e652257b0849a6855d7.
// User authorized reuse; XXT's stricter contradiction/scope checks remain required.
export function catalogStatus(node) {
  if (!node) return 'unknown';
  const own = selector => [...node.querySelectorAll(selector)].filter(el =>
    el.closest('.posCatalog_select') === node && !el.closest('.ans-attach-online'));
  const counts = own('.jobUnfinishCount');
  const values = counts.map(el => String(el.value ?? el.textContent).trim());
  if (values.some(value => !/^\d+$/.test(value))) return 'unknown';
  if (values.some(value => Number(value) > 0)) return 'incomplete';
  return own('.icon_Completed').length ? 'completed' : 'unknown';
}
