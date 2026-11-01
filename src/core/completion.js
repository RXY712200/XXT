import { Credit } from './contracts.js';
import { inspectInventory } from '../platform/inventory.js';

/** Local state is deliberately not an input to the platform-credit evaluator. */
export function evaluateCompletion(inventory) {
  const fresh = inspectInventory(inventory);
  const reasons = [...fresh.hazards];
  if (!fresh.valid) reasons.push('stale-or-unsafe-inventory');
  const validEvidence = (item, scope) => item?.provenance === 'observed-dom' && item.scope === scope;
  if (!validEvidence(fresh.lesson?.credit, 'lesson') || fresh.lesson.credit.subject !== fresh.lesson.key) reasons.push('unowned-lesson-evidence');
  for (const task of fresh.tasks) {
    if (!validEvidence(task.credit, 'task') || task.credit.subject !== task.key || task.credit.reason === 'ambiguous-credit-owner') reasons.push('ambiguous-task-evidence');
    if (task.credit.status === Credit.CONTRADICTORY) reasons.push('contradictory-task-evidence');
  }
  if (fresh.lesson?.credit.status === Credit.CONTRADICTORY) reasons.push('contradictory-lesson-evidence');
  return Object.freeze({ fresh, safe: reasons.length === 0, reasons: Object.freeze([...new Set(reasons)]),
    lessonConfirmed: reasons.length === 0 && fresh.lesson?.credit.status === Credit.CONFIRMED,
    taskConfirmed: Object.freeze(fresh.tasks.filter(task => task.credit.status === Credit.CONFIRMED).map(task => task.key)) });
}
