/** One logical key is usable once per scheduler lifetime; cancellation is final. */
export function createScheduler(clock = {
  now: () => Date.now(), setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: id => globalThis.clearTimeout(id)
}) {
  const actions = new Map();
  function cancel(key) {
    const action = actions.get(key);
    if (!action || action.status !== 'pending') return false;
    action.status = 'cancelled'; clock.clearTimeout(action.timer); return true;
  }
  return Object.freeze({
    request({ key, delay = 0, validate, execute, onInvalid = () => {}, onError = () => {} }) {
      if (typeof key !== 'string' || !key || actions.has(key)) return false;
      if (!Number.isSafeInteger(delay) || delay < 0) throw new RangeError('Delay must be nonnegative integer milliseconds');
      const action = { key, deadline: clock.now() + delay, status: 'pending' };
      actions.set(key, action);
      action.timer = clock.setTimeout(() => {
        if (action.status !== 'pending') return;
        try {
          if (!validate()) { action.status = 'invalidated'; onInvalid(); return; }
          action.status = 'executed';
          Promise.resolve(execute()).catch(onError);
        } catch (error) { action.status = 'failed'; onError(error); }
      }, delay);
      return true;
    },
    cancel,
    cancelAll() { for (const key of actions.keys()) cancel(key); },
    snapshot: () => Object.freeze([...actions.values()].map(({ key, deadline, status }) => Object.freeze({ key, deadline, status })))
  });
}
