import { Credit, State } from './contracts.js';
import { evaluateCompletion } from './completion.js';
import { targetAfter } from '../platform/fork-target.js';

/** Permits are private branded, short-lived, single-use decisions, never clicks. */
export function createNavigationGate({ now, context, ttl = 5000, onEvent = () => {} }) {
  if (!Number.isSafeInteger(ttl) || ttl <= 0 || ttl > 30000) throw new RangeError('Invalid permit lifetime');
  const permits = new WeakMap();
  const emit=(stage,reason='none')=>{try{onEvent(stage,reason);}catch{/* Observation never grants authority. */}};
  function eligibility(mode) {
    const c = context();
    if (c.stopped || c.active || !c.inventory) return { reason: 'inactive-or-busy-context' };
    const evaluated = evaluateCompletion(c.inventory), f = evaluated.fresh;
    if (!evaluated.safe || f.lesson?.restricted) return { reason: 'unsafe-completion-context' };
    const i = f.catalog.findIndex(item => item.key === f.lesson.key);
    let selection;
    if (mode === 'assessment') {
      if (f.assessment !== 'optional' || f.tasks.length !== 1 || f.tasks[0].kind !== 'assessment') return { reason: 'not-isolated-optional-assessment' };
      const preceding = f.catalog.slice(0, i).filter(item => item.chapterKey === f.lesson.chapterKey);
      const learning=preceding.filter(item=>!item.optionalAssessment);
      if (!learning.length || learning.some(item => item.assessmentLike || item.restricted || item.credit.status !== Credit.CONFIRMED)) return { reason: 'unverified-preceding-learning' };
      selection=targetAfter(f.catalog,f.lesson.key,true);
    } else {
      if (!['completed', 'prior-credit'].includes(mode) || !evaluated.lessonConfirmed || f.assessment) return { reason: 'lesson-not-credited' };
      if (f.tasks.some(task => ['unknown', 'assessment'].includes(task.kind))) return { reason: 'unsupported-boundary' };
      const blocked = c.records.some(record => [State.FAILED, State.UNRESOLVED, State.UNSUPPORTED, State.PAUSED, State.CANCELLED].includes(record.state));
      if (blocked) return { reason: 'unresolved-execution' };
      if (mode === 'completed' && f.tasks.some(task => !evaluated.taskConfirmed.includes(task.key) &&
        !c.records.some(record => record.key === task.key && record.state === State.WAITING_PLATFORM))) return { reason: 'unfinished-local-task' };
      if (f.tasks.some(task => task.credit.status === Credit.INCOMPLETE)) return { reason: 'incomplete-task-evidence' };
      selection=targetAfter(f.catalog,f.lesson.key);
    }
    if(selection.reason)return {reason:selection.reason};
    const {target,deferred}=selection;
    if (!target || target.restricted || !target.key || target.assessmentLike && !target.optionalAssessment) return { reason: 'no-eligible-target' };
    // A currently playing player cannot be abandoned by a pre-credit shortcut.
    if (f.documents.some(doc => [...doc.querySelectorAll('video,audio')].some(el => !el.paused && !el.ended || el.seeking))) return { reason: 'media-still-active' };
    return { c, evaluated, target, deferred };
  }
  return Object.freeze({
    issue(mode = 'completed') {
      const result = eligibility(mode);
      if (result.reason) { emit('target-rejected',result.reason);return Object.freeze({ allowed: false, reason: result.reason }); }
      const { c, evaluated, target, deferred } = result;
      if(evaluated.lessonConfirmed)emit('completion-validated');
      emit('target-selected');
      const permit = Object.freeze({ courseKey: evaluated.fresh.courseKey, lessonKey: evaluated.fresh.lesson.key,
        revision: c.inventory.revision, generation: c.generation, targetKey: target.key, mode, expires: now() + ttl,
        evidence: evaluated.fresh.lesson.credit, deferred });
      permits.set(permit, { inventory: c.inventory, used: false });
      emit('permit-issued');
      return Object.freeze({ allowed: true, permit });
    },
    consume(permit) {
      const stored = permits.get(permit);
      if (!stored || stored.used) { emit('permit-rejected','permit-invalid');return null; }
      stored.used = true;
      const result = eligibility(permit.mode);
      if (result.reason || now() >= permit.expires || result.c.inventory !== stored.inventory ||
        result.c.generation !== permit.generation || result.c.inventory.revision !== permit.revision ||
        result.evaluated.fresh.courseKey !== permit.courseKey || result.evaluated.fresh.lesson.key !== permit.lessonKey ||
        result.target.key !== permit.targetKey || JSON.stringify(result.deferred)!==JSON.stringify(permit.deferred)) {
        emit('permit-rejected',now()>=permit.expires?'permit-expired':result.reason||'permit-invalid');return null;
      }
      emit('permit-consumed');
      return Object.freeze({ ...permit, target: result.target });
    },
    renew(permit) {
      const stored = permits.get(permit);
      if (!stored || stored.used) { emit('permit-rejected','permit-invalid');return null; }
      const result = eligibility(permit.mode);
      if (result.reason || result.c.inventory !== stored.inventory || result.c.generation !== permit.generation ||
        result.c.inventory.revision !== permit.revision || result.evaluated.fresh.courseKey !== permit.courseKey ||
        result.evaluated.fresh.lesson.key !== permit.lessonKey || result.target.key !== permit.targetKey ||
        JSON.stringify(result.deferred)!==JSON.stringify(permit.deferred)) { emit('permit-rejected',result.reason||'permit-invalid');return null; }
      stored.used = true;
      const renewed = Object.freeze({ ...permit, evidence: result.evaluated.fresh.lesson.credit, expires: now() + ttl });
      permits.set(renewed, { inventory: stored.inventory, used: false });emit('permit-renewed');return renewed;
    }
  });
}
