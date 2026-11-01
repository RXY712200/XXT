import { startMedia } from './media.js';
export function createVideoAdapter({ enabled = true, background = true } = {}) {
  return Object.freeze({ recognize: task => enabled && task.kind === 'video' && task.identity === 'verified' && Boolean(task.player),
    start: context => startMedia(context, 'video', { background }) });
}
