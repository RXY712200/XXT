# XXT

XXT is a new independent project for evidence-based Chaoxing task coordination.
It is in development. It is not a finished userscript, a stable replacement for
another project, or an authenticated production-tested product.

Repository: [RXY712200/XXT](https://github.com/RXY712200/XXT).
Canonical working directory: `D:\XXT`; branch: `main`.

Phase I was independently accepted at
`dc3232040fa4df30ae58eeb08ebc102f2b06942e`. Phase II, Steps 03 and 04, is a
candidate pending ChatGPT review: read-only platform recognition, ordered task
inventories, a cancellable coordinator, fresh credit evaluation and single-use
navigation permits. Tests use inert synthetic DOM and simulated effects only.
There is no real playback, reader, live-session automation, native navigation,
browser bootstrap, installable userscript, build packaging or release artifact.

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

Phase III has not started. It requires independent Phase II acceptance and new
user authorization. No website upload, deployment or release is authorized.
