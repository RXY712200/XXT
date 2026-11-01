# XXT

XXT is a new independent project for evidence-based Chaoxing task coordination.
It is in development. It is not a finished userscript, a stable replacement for
another project, or an authenticated production-tested product.

Repository: [RXY712200/XXT](https://github.com/RXY712200/XXT).
Canonical working directory: `D:\XXT`; branch: `main`.

Phase II was independently accepted at
`2428489a83d147542b6e318d0bcaeaa6b9766b01`. Phase III (05/06) is a candidate
pending review: native video/audio adapters, 1.0x, promise-aware startup, bounded
policy fallback and background recovery integrated with the existing coordinator.
Completion/navigation gates remain independent of local media results.
There is no automatic page bootstrap, reader, live-session automation, native
catalog navigation, installable userscript, build packaging or release artifact.

Start with [HANDOFF](docs/HANDOFF.md). Read the [feature matrix](docs/FEATURE_MATRIX.md)
and [master plan](docs/MASTER_PLAN.md) before proposing implementation.

The intended product uses normal 1.0x playback, separates local execution from
platform credit, preserves unresolved tasks and never answers assessments or
manufactures progress. Background playback recovery is a core requirement.

Earlier projects are read-only functional references. Their production code,
tests, fixtures, documentation and Git history are not imported. This statement
describes the working method; it is not a legally verified clean-room claim.

## Development checks

Use Node.js 22 or later and npm:

```text
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run check
```

`jsdom` is development-only; production has no external dependencies. Importing
production modules installs nothing on a page. See [Phase II contracts and
evidence](docs/PHASE_II.md) for explicit assembly and the fake-runtime boundary.
These checks do not establish authenticated Chaoxing compatibility.
See [Phase III evidence](docs/PHASE_III.md) for native-browser and synthetic results.
Optional local Chrome smoke: `node scripts/browser-media.mjs` (Windows default
Chrome path; override `XXT_CHROME`; uses an isolated ignored `.local/` profile).

Phase IV has not started. It requires independent Phase III acceptance and new
user authorization. No website upload, deployment or release is authorized.
