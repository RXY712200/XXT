/** Local execution and observed platform credit are deliberately independent. */
export const Credit = Object.freeze({ UNKNOWN: 'unknown', CONFIRMED: 'confirmed', INCOMPLETE: 'incomplete', CONTRADICTORY: 'contradictory' });

export function identity(parts) {
  return parts.every(part => typeof part === 'string' && part.length > 0) ? JSON.stringify(parts) : null;
}

export function evidence(subject, scope, status, reason) {
  return Object.freeze({ subject, scope, status, reason, provenance: 'observed-dom' });
}

export const State = Object.freeze(Object.fromEntries([
  'DISCOVERED', 'PENDING', 'READY', 'STARTING', 'RUNNING', 'LOCAL_COMPLETED',
  'WAITING_PLATFORM', 'RESTORED_WAITING_PLATFORM', 'FAILED', 'UNRESOLVED', 'UNSUPPORTED', 'PAUSED', 'CANCELLED'
].map(name => [name, name])));

const transitions = {
  DISCOVERED: ['PENDING'], PENDING: ['READY', 'UNSUPPORTED', 'RESTORED_WAITING_PLATFORM'], READY: ['STARTING'],
  STARTING: ['RUNNING', 'FAILED'], RUNNING: ['LOCAL_COMPLETED', 'FAILED'],
  LOCAL_COMPLETED: ['WAITING_PLATFORM'], FAILED: ['UNRESOLVED'], PAUSED: ['PENDING']
};
export function transition(record, next) {
  if (!Object.values(State).includes(next) ||
    !(transitions[record.state]?.includes(next) ||
      (['PAUSED', 'CANCELLED'].includes(next) && !['CANCELLED', 'PAUSED'].includes(record.state)))) {
    throw new Error(`Illegal task transition: ${record.state} -> ${next}`);
  }
  record.state = next;
  record.history.push(next);
}
