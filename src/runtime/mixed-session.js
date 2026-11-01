import { acquireSession } from './session.js';
import { createInventoryReader } from '../platform/inventory.js';
import { createVideoAdapter } from '../adapters/video.js';
import { createAudioAdapter } from '../adapters/audio.js';
import { createDocumentAdapter } from '../adapters/document.js';
import { createLiveAdapter } from '../adapters/live.js';

/** Explicit assembly, no automatic browser boot or catalog activation. */
export function acquireMixedSession(document, { video = {}, audio = {}, reader = {}, ...options } = {}) {
  const session = acquireSession(document, { autoContinue: true, ...options, adapters: {
    video: createVideoAdapter(video), audio: createAudioAdapter(audio), document: createDocumentAdapter(reader), live: createLiveAdapter()
  } });
  const inventory = createInventoryReader();
  return Object.freeze({ ...session, inspect: () => inventory.scan(document) });
}
