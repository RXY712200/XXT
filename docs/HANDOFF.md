# XXT handoff — Phase IV candidate

## Identity / acceptance

- Root `D:\XXT`; repository https://github.com/RXY712200/XXT; branch `main`.
- Phase I accepted `dc3232040fa4df30ae58eeb08ebc102f2b06942e`.
- Phase II accepted `2428489a83d147542b6e318d0bcaeaa6b9766b01`.
- Phase III scoped implementation accepted; this delivery starts at
  `64b67cb29ed95ee03946775f43c8b9bee29c9b76`.
- Phase IV Steps 07/08 candidate pending independent ChatGPT acceptance.
- Authenticated Chaoxing compatibility is NOT accepted. Phase V NOT started.
- Current SHA: `git rev-parse HEAD`; verify `git ls-remote origin refs/heads/main`.
  Exact delivery SHA is in the report; do not hardcode this file's own hash.

## New interfaces

- `src/adapters/document.js`: geometry-based accessible native HTML reading within
  an existing owned native document iframe; no guessed PDF-plugin/viewer selectors.
- `src/adapters/live.js`: native entry/status/destination description, passive
  trusted-click observation and read-only optional replay lifecycle observer.
  No handler invocation, popup assumption, transport, automatic return or tab close.
- `src/adapters/recognition-only.js`: five disabled descriptors with explicit
  missing-structure reasons; no invented book/timed/slides/link/legacy matches.
- `src/runtime/mixed-session.js`: explicitly acquire one existing page coordinator
  with video/audio/document/live adapters and same-lesson autoContinue enabled.
- `src/core/coordinator.js`: optional event-driven continuation after accepted local
  completion, default false to preserve prior consumers; scoped diagnostic notes.
- `src/platform/inventory.js`: native-live href/label changes invalidate inventory.
- Accepted media/source/recovery/scheduler logic is unchanged. No new dependencies.

## Tests / evidence

- `npm test`: 64 synthetic cases; all 56 previous cases unchanged, plus 8 mixed tests.
- `npm run check`: syntax/imports and no unauthorized browser/network actions.
- `npm ls --omit=dev`: empty production dependencies.
- `node scripts/browser-media.mjs`: native Chrome generated WAV audio/video smoke
  plus actual HTML nested-iframe scroll geometry/local bottom (top=range=100).
  Audio autoplay remains policy-denied even muted; no invented completion.
- Reader test heights/events/time and fake media in mixed tests are synthetic.
  Native Chrome uses synthetic ownership, not authenticated course inventory.
- Completion/assessment/navigation gate, scheduler, source identity and all prior
  tests preserved. MASTER_PLAN remains exactly five phases / ten steps.

## Limits / next gate

- Supported reading: one unambiguous native HTML scroll region inside owned
  accessible document frames, or visibly fitting nonempty HTML. Delayed readiness
  bounded 5000ms; intervals 400–900ms, variable incremental steps, stable bottom.
- Proprietary/binary PDF/plugin, inaccessible or ambiguous viewers unsupported.
- Native live entry waits for real user action. Actual popup/child ownership and
  message provenance unavailable; no auto return/navigation, close or GM grants.
- Replay observer distinguishes finite/unknown duration, real local progression/
  ended and premature closure, but ALWAYS has completionAuthority=false.
- Five extra type descriptors intentionally disabled pending real structural evidence.
- Optional assessment eligibility remains a decision only; no real handoff/answers.
- Mixed autoContinue never crosses unknown/unsafe boundaries, never supplies credit
  and never clicks the catalog. Failure policy remains explicit and conservative.
- No Phase V UI, persistence, rest/pacing, installable/build/release or deployment.
- No private snapshots or reference production code/tests/history imported; old
  fork/upstream/Quiveld untouched. No PR/Issue/tag/workflow/website upload.
- STOP after Phase IV. Independent acceptance and explicit authorization are needed
  for Phase V; real reader/live/player/origin evidence remains a prerequisite for
  unsupported platform paths, not permission to invent them.
