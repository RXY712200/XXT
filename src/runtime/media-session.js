import { acquireSession } from './session.js';
import { createInventoryReader } from '../platform/inventory.js';
import { createVideoAdapter } from '../adapters/video.js';
import { createAudioAdapter } from '../adapters/audio.js';

/** Explicit opt-in assembly; no automatic boot or native catalog actions. */
export function acquireMediaSession(document, { video = {}, audio = {}, ...options } = {}) {
  const session = acquireSession(document, { ...options, adapters: {
    video: createVideoAdapter(video), audio: createAudioAdapter(audio)
  } });
  const reader = createInventoryReader();
  return Object.freeze({ ...session, inspect() { return reader.scan(document); } });
}
