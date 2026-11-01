// No platform selectors for these five types are established by the accepted
// XXT evidence. Keep explicit descriptors disabled rather than inventing matches.
export const recognitionOnly = Object.freeze(['book-knowledge-map','timed-reader','audio-slides','hyperlink','legacy-multimedia'].map(kind =>
  Object.freeze({ kind, executable: false, recognize: () => false, reason: 'missing-verified-platform-structure' })));
