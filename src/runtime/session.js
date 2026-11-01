import { createCoordinator } from '../core/coordinator.js';

// Explicit assembly only: no browser boot, listeners, clicks or media adapters.
const sessions = new WeakMap();
export function acquireSession(document, options) {
  if (!document?.documentElement) throw new TypeError('An owned document is required');
  if (sessions.has(document)) return sessions.get(document);
  const coordinator = createCoordinator(options);
  const session = Object.freeze({ coordinator, dispose() {
    coordinator.destroy(); if (sessions.get(document) === session) sessions.delete(document);
  } });
  sessions.set(document, session); return session;
}
