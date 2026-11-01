# XXT

XXT is a new independent project for evidence-based Chaoxing task coordination.
It is in development. It is not a finished userscript, a stable replacement for
another project, or an authenticated production-tested product.

Repository: [RXY712200/XXT](https://github.com/RXY712200/XXT).
Canonical working directory: `D:\XXT`; branch: `main`.

Phase III was accepted for scoped implementation at
`64b67cb29ed95ee03946775f43c8b9bee29c9b76`. Phase IV (07/08) is a candidate
pending review: accessible native HTML document scrolling, event-driven mixed-task
continuation and a conservative manual native-live boundary. Unknown structures
and unverified cross-window completion remain unsupported.
There is no automatic page bootstrap, real catalog navigation, installable,
production packaging, settings/pacing UI or release artifact.

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
See [Phase IV evidence](docs/PHASE_IV.md) for native-browser, synthetic and
unsupported-path results.
Optional local Chrome smoke: `node scripts/browser-media.mjs` (Windows default
Chrome path; override `XXT_CHROME`; uses an isolated ignored `.local/` profile).

Phase V has not started. It requires independent Phase IV acceptance and new
user authorization. No website upload, deployment or release is authorized.
