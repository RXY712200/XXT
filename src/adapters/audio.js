import { startMedia } from './media.js';
export function createAudioAdapter({ enabled = true, background = true } = {}) {
  return Object.freeze({ recognize: task => enabled && task.kind === 'audio' && task.identity === 'verified' && Boolean(task.player),
    start: context => startMedia(context, 'audio', { background }) });
}
