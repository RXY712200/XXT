export const storageKey = 'xxt.state.v1';
export const defaults = Object.freeze({ automation: true, video: true, audio: true, document: true, continuation: true,
  navigation: false, background: true, delays: true, minMs: 5000, maxMs: 12000,
  restEnabled: false, restCount: null, restMs: null });

export function validateSettings(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !Object.hasOwn(defaults,key))) throw Error('invalid-settings');
  const settings = { ...defaults, ...input };
  for (const key of Object.keys(defaults).filter(key => typeof defaults[key] === 'boolean')) if (typeof settings[key] !== 'boolean') throw Error('invalid-settings');
  if (![settings.minMs,settings.maxMs].every(n => Number.isSafeInteger(n) && n >= 0 && n <= 60000) || settings.minMs > settings.maxMs) throw Error('invalid-delay-range');
  if (settings.restCount !== null && (!Number.isSafeInteger(settings.restCount) || settings.restCount < 1 || settings.restCount > 1000)) throw Error('invalid-rest-count');
  if (settings.restMs !== null && (!Number.isSafeInteger(settings.restMs) || settings.restMs < 1000 || settings.restMs > 86400000)) throw Error('invalid-rest-duration');
  if (settings.restEnabled && (settings.restCount === null || settings.restMs === null)) throw Error('rest-configuration-required');
  return Object.freeze(settings);
}
export function sampleDelay(settings, random = Math.random) {
  if (!settings.delays) return 0;
  const draw = random(); if (!(draw >= 0 && draw < 1)) throw Error('invalid-random');
  return settings.minMs + Math.floor(draw * (settings.maxMs - settings.minMs + 1));
}

export function createPreferences(storage, now = () => Date.now()) {
  const fresh = () => ({ version: 1, settings: defaults, stopped: false, restUntil: 0, count: 0, seen: [] });
  let state = fresh(), error = null;
  function validate(value) {
    if (!value || value.version !== 1 || typeof value.stopped !== 'boolean' || !Number.isSafeInteger(value.restUntil) || value.restUntil < 0 ||
      !Number.isSafeInteger(value.count) || value.count < 0 || !Array.isArray(value.seen) || value.seen.length > 2048 ||
      value.seen.some(key => typeof key !== 'string' || !key) || new Set(value.seen).size !== value.seen.length) throw Error('invalid-stored-state');
    return { version: 1, settings: validateSettings(value.settings), stopped: value.stopped, restUntil: value.restUntil, count: value.count, seen: [...value.seen] };
  }
  function save(next) {
    try { const checked = validate(next); storage.setItem(storageKey, JSON.stringify(checked)); state = checked; error = null; }
    catch { error = 'storage-unavailable'; state = { ...state, stopped: true }; throw Error(error); }
  }
  try {
    const raw = storage.getItem(storageKey);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (parsed.version === 0 && typeof parsed.stopped === 'boolean') save({ ...fresh(), stopped: parsed.stopped, settings: validateSettings(parsed.settings) });
      else state = validate(parsed);
    }
  } catch { error = 'invalid-or-unavailable-storage'; state = { ...fresh(), stopped: true }; }
  return Object.freeze({
    snapshot: () => Object.freeze({ ...state, settings: state.settings, seen: Object.freeze([...state.seen]), error }),
    stop() { save({ ...state, stopped: true }); },
    resume() { if (error) throw Error(error); save({ ...state, stopped: false }); },
    update(patch) { save({ ...state, settings: validateSettings({ ...state.settings, ...patch }) }); },
    restore() { save(error ? { ...fresh(), stopped: true } : { ...state, settings: defaults }); },
    record(key, kind) {
      if (!['video','audio','document'].includes(kind) || state.seen.includes(key)) return false;
      if (state.seen.length >= 2048) { error = 'pacing-capacity-reached'; throw Error(error); }
      const count = state.count + 1, rest = state.settings.restEnabled && count >= state.settings.restCount;
      save({ ...state, seen: [...state.seen, key], count: rest ? 0 : count,
        restUntil: rest ? now() + state.settings.restMs : state.restUntil }); return true;
    },
    resting: () => state.restUntil > now()
  });
}
