export const recognitionOnly = Object.freeze(['book-knowledge-map','timed-reader','audio-slides','hyperlink','legacy-multimedia'].map(kind =>
  Object.freeze({ kind, executable: false, recognize: () => false, reason: 'missing-verified-platform-structure' })));
