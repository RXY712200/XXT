/** One logical key is usable once per scheduler lifetime; cancellation is final. */
export function createScheduler(clock = {
  now: () => Date.now(), setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: id => globalThis.clearTimeout(id)
}) {
  const actions = new Map();
  function cancel(key) {
    const action = actions.get(key);
    if (!action || !(action.status === 'pending' || action.recurring && action.status === 'executing')) return false;
    action.status = 'cancelled'; clock.clearTimeout(action.timer); return true;
  }
  function enqueue({ key, delay = 0, validate, execute, onInvalid = () => {}, onError = () => {} }, recurring = false) {
    if (typeof key !== 'string' || !key || actions.has(key)) return false;
    if (!Number.isSafeInteger(delay) || delay < 0) throw new RangeError('Delay must be nonnegative integer milliseconds');
    if (recurring && delay === 0) throw new RangeError('Recurring interval must be positive');
    const action = { key, deadline: clock.now() + delay, status: 'pending', recurring, epoch: 0 };
    actions.set(key, action);
    function arm() {
      action.deadline = clock.now() + delay;
      action.status = 'pending';
      const epoch = ++action.epoch;
      action.timer = clock.setTimeout(() => run(epoch), delay);
    }
    function finish() { if (recurring && action.status === 'executing') arm(); }
    function error(reason) { if (action.status !== 'cancelled') { action.status = 'failed'; onError(reason); } }
    function run(epoch) {
      if (action.status !== 'pending' || epoch !== action.epoch) return;
      try {
        if (!validate()) { action.status = 'invalidated'; onInvalid(); return; }
        action.status = recurring ? 'executing' : 'executed';
        const result = execute();
        if (result?.then) Promise.resolve(result).then(finish, error); else finish();
      } catch (reason) { error(reason); }
    }
    arm();
    return true;
  }
  return Object.freeze({
    request: action => enqueue(action),
    recurring: action => enqueue(action, true),
    cancel,
    cancelAll() { for (const key of actions.keys()) cancel(key); },
    snapshot: () => Object.freeze([...actions.values()].map(({ key, deadline, status }) => Object.freeze({ key, deadline, status })))
  });
}
