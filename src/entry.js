import { bootstrap } from './runtime/browser.js';
if (typeof window !== 'undefined' && window.document) bootstrap(window.document);
