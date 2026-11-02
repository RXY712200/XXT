/** Evidenced objective/video labels only; numeric-only tabs are never inferred. */
export function currentStepTitle(document) {
  const titles = [...document.querySelectorAll('.prev_title')];
  return titles.length === 1 ? (titles[0].getAttribute('title') || titles[0].textContent || '').trim() : '';
}
export function isActiveVideoTab(document,target) {
  const title = currentStepTitle(document), label = target.textContent.trim();
  if (!/^(?:\d+\s*)?视频$/.test(title)) return false;
  return title === label || [...document.querySelectorAll('.prev_white')].filter(node => /^(?:\d+\s*)?视频$/.test(node.textContent.trim())).length === 1;
}
export function objectiveVideoTab(document) {
  if (currentStepTitle(document) !== '学习目标') return null;
  if (document.querySelector('input[type=password],input[autocomplete="one-time-code"]')) return null;
  const matches = [...document.querySelectorAll('.prev_white')].filter(node => {
    const style = document.defaultView.getComputedStyle(node);
    return node.isConnected && !node.hidden && style.display !== 'none' && style.visibility !== 'hidden' &&
      /^(?:\d+\s*)?视频$/.test(node.textContent.trim()) && !node.closest('[aria-disabled="true"],[disabled]');
  });
  return matches.length === 1 ? matches[0] : null;
}
export function activateObjectiveTab(document, target) {
  if (objectiveVideoTab(document) !== target) return false;
  target.click(); return true; // Original native handler, no fabricated trusted gesture.
}
