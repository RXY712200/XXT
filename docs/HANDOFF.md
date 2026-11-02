# XXT handoff — independent foundation / direct V3 transplant

## Current scope and Git identity

Starting XXT/main: `0d8a0829947cbda4de8f22cace5242cf8d5847b5`.
Final commit is the commit containing this file; verify HEAD against origin/main.
The owner explicitly superseded the external-canonical fallback: replace only the
inherited third-party foundation and directly preserve the developed fork code.
This correction is not a new phase. Stop after one coherent XXT/main delivery.

## Canonical paths and references

- Target: `D:\XXT`, RXY712200/XXT, main.
- Only editable production entry: `D:\XXT\src\entry.js`.
- Only generated installable: `D:\XXT\dist\XXT.user.js`.
- Build: `scripts/build-userscript.mjs`, metadata `userscript/metadata.json`.
- Read-only fork: `D:\xuexitongScript-master`, branch
  review/v3.4.0-modular-navigation at `351c08dc4d772908c3d098e8c9160be434bf1064`.
- Read-only upstream: `9a23b357875a72ed9bfd9e652257b0849a6855d7`.
- Reference source/installable: `D:\xuexitongScript-master\v3_optimized.js` and
  `D:\xuexitongScript-master\v3_optimized.user.js`. Neither was edited/regenerated.
- Reference original installable disk SHA-256 remains
  `cb74e06c58f6d68c8c4f75c6a006e6fdf9be5799948ec5669237b4c3ff5cbab0`.

The builder embeds only src/entry.js plus metadata, not the retired XXT module
registry. Other historical src/ modules remain unmodified/inactive. No wrapper,
external engine loader, second coordinator or automatic optional bridge.

## Provenance and preserved contracts

See FOUNDATION_TRANSPLANT.md and provenance/transplant.json: full source comparison,
all 59 intervening commits, +3,087/-209 diff, surviving blame, exact segment/function
hashes and 26 adaptations. No full inherited file copied. Git-added is not ownership
proof; the owner's authorization and reviewed history support developed-fragment reuse.
No additional ownership-ambiguous subsystem requiring omission was identified.
No copyright/legal certainty or clean-room claim is made.

3,099 nonempty source lines outside adaptations are exact; 3,029 are diff-added.
93 new functions/methods are fully byte-identical. Shared syntax/API calls are
separately recorded. New foundation only covers the eight authorized groups:
startup/lifetime, tree access, basic owned media integration, playback primitives,
monitoring/recovery hooks, events, native steps and background cleanup. Higher-level
fork discovery, media/audio/document, completion/navigation, GM, pacing, recovery,
partial progress, diagnostics and original two-area UI stay in control.

Explicit Stop, terminal exhaustion, recoverable transitions and automatic block
remain distinct. `_block`, stopAutomation and bounded recovery are exact developed
code; no blanket automatic-failure-to-persistent-Stop conversion. Do not refactor
these subsystems or revive retired XXT interfaces to satisfy historical tests.

## Metadata / installation boundary

Separate XXT name/namespace/version; same original match patterns, document-idle,
raw sandbox and authorized unsafeWindow/GM storage/listener/window.close grants.
Retired XXT grant-none/noframes metadata is explicitly superseded for the existing
GM execution context. No new cross-origin connect/require or update/download URL.
Optional bridge untouched, unbundled and not installed. No working installation
or reference repository is modified; installation/activation requires owner action.

## Observed gates

- npm run build: deterministic single-entry build PASS.
- npm run audit:transplant: exact provenance and reference integrity PASS.
- npm run check: active syntax/imports, one entry and artifact integrity PASS.
- npm test: 9 focused tests PASS / 0 FAIL (controlled jsdom/media/timers).
- npm run verify:artifact: exact disk bytes PASS.
- npm ls --omit=dev: no production package dependencies.
- Historical 137 rewrite and three fallback tests remain assets, not acceptance
  contracts. The retired rewritten Chromium harness remains disabled.

New XXT artifact SHA-256:
`bfc46537cb29ebca49f9c4d65f9562f2ed198068247f85d11f9ec55fdbf1e0e5`.

## Remaining acceptance limits

PARTIAL pending independent review and owner-authenticated testing. The owner
reports the original fork works; this candidate is not yet authenticated accepted.
No actual Tampermonkey sandbox/grant execution, GM pairing, browser popup/close,
background throttling, real reader geometry or server credit is proved by mocks.
No claim of universal DOM compatibility, release readiness or stable publication.
No fork/upstream writes, master changes, PR/Issue/Release/tag/workflow/deployment,
force-push or automatic browser installation. Stop after delivery.
