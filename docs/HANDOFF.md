## Current correction: 实验报告3 content recognition and dynamic startup

Baseline af8109213cf7bb5dbe8d290d23d0c483be20f6d9. Owner confirmed prior
recognition failed in authenticated Chaoxing. This candidate still requires retesting.
The active course-card hierarchy now recognizes ordinary chapter-test/short-answer
or upload-report instructions together with an editor/file interface and submission
control. Exact editor class/button identity is no longer required (previous observed
class combination remains supported). Answer fields/toolbars are normal assessment UI.
Unfinished independent media still prevents handoff. Explicit exam/authentication
and CAPTCHA evidence blocks. Unreadable marked attachment frames remain blocking;
auxiliary editor iframe unreadability or reconstruction alone is not a task boundary.

_run's existing _isChapterTest check now sees this content before choosing media
startup waiting. _waitForStartup rechecks content and cleans up its wait, resets READY,
then calls the existing _advanceChapterTest handoff. No second navigation path.
The assessment authorization revalidates current classification, course, topology and
course-card frame, plus existing lesson/route/generation/target guards. Equivalent
editor/button rerendering does not revoke authorization solely for element replacement.
Platform credit and media progress rules are unchanged; submission remains unfinished.

Changed production methods: _uploadAssignment, _assessmentTarget,
_externalNavigationEligible and _waitForStartup. Existing calls integrate without
rewriting run/play/_advanceChapterTest/_queueNavigation/playCurrentIndex.
All five essential commands pass; npm test: 21 passed / 0 failed. One new focused
scenario uses 实验报告3, dynamically inserted 章节测验 + 简答题 + textarea + 保存/提交,
then replaces the editor DOM during navigation delay: one native target activation,
no changed platform task count. This is controlled jsdom/media/clock evidence only.
Updated only affected provenance mappings/function hashes; outside-maintenance
counts: 2805 nonempty / 2741 diff-added / 88 identical function entries.
Artifact SHA-256: 28b68f20422d4d6a335a9d029532c24d26748ab961e7be7eda7f53547994137f.
Reference checkout, inactive modules, metadata and optional bridge remain untouched.
Stop after one XXT/main push for independent review. Historical notes follow.

## Current candidate: upload-assignment assessment handoff

Starting HEAD: 1fa06c52c816508296d45a1bb6d408cd9baac717.
Read-only reference restored by full clone at D:\xuexitongScript-master; verified
origin, branch, HEAD 351c08dc4d772908c3d098e8c9160be434bf1064, clean state,
non-shallow history, upstream ancestor and three required source/build files.
No reference edits, build, commit or push performed.

Recognition requires both observed edui classes and exactly one a.btnSubmit with
submission text in the same owned document. All accessible nested documents are
accounted for; unknown populated leaves, unreadable branches, unfinished media,
exam/answer and authentication evidence prevent recognition. Only one uniquely
matched submission document is currently supported. Generic attach-iframe or
editor upload control alone does not authorize navigation.

Uses the EXISTING assessment handoff: _isChapterTest / _advanceChapterTest /
_assessmentTarget / _externalNavigationEligible, then unchanged _queueNavigation
and playCurrentIndex. The assessment record adds upload scope and deferred label;
localDone is the existing handoff flag, NOT platform credit or upload completion.
Before clicking, current course/catalog topology/documents/submit owner are checked
again. Existing navigation settings, Stop, delays and destination checks apply.
No upload/submit/answer interaction. No pacing completion count for the deferred item.
A mixed lesson is only eligible once other media are ended AND independently credited;
otherwise existing media behavior remains in control. Multiple submission documents
and ambiguous unrelated structures remain unsupported; actual owner DOM may therefore
still require refinement after authenticated testing.

Checks: build, provenance audit, syntax/check, test (20 pass/0 fail), exact artifact
verification. One added smoke case covers positive handoff, generic near-match,
unfinished video and removed submission owner. Existing freeze expectation excludes
only the authorized recognition/handoff methods and still freezes other production code.
Conservative preserved counts: 2877 nonempty / 2812 diff-added / 89 identical entries.
SHA-256: 00564399c33148f3ddcf0e551fda6431cba5fc2d45a25707d732947366693d48.
Synthetic jsdom/media/clock evidence only. No real-browser acceptance claimed.
Stop after one coherent XXT/main push for independent review. Older notes follow.

## Current correction: cross-lesson replay session lock

Baseline: 30a3d2c9ff96bdfed289a1b391e3b7330ff374d1. Migration is complete;
owner reports broad authenticated operation. This candidate is not yet authenticated accepted.
Only GM begin/waitingFor, child disposal and native-open refusal state changed.
Cross-lesson admission now checks matching child pulse, parent pulse, claim and binding
windows (pending 120s / child 180s), not just 4h expiry. A live matching child still
blocks even if the outer record expires. Orphans are re-read before cancellation;
ID/nonce/phase/owner timestamps and late matching pulse/claim are checked again.
GM storage has no compare-and-swap: these checks reduce races but do not claim atomicity.
Disposal/pagehide cancels only this exact child's unfinished active record, idempotently.
Completed/newer records remain untouched. Existing same-lesson retry budget is unchanged.
Refused native opening no longer claims WAITING_LIVE for another lesson; an adopted
valid current-lesson session still waits. No click is made on refusal.
The audible/muted request implementation is byte-identical to baseline (test).
Parent terminal credit rules, grants, foundation and all unrelated code remain frozen.
Provenance records affected native-open/GM maintenance ranges and hashes; conservative
outside-maintenance exact counts are now 2927 nonempty / 2857 diff-added / 91 functions.
Build/audit/check/tests/artifact synchronization pass. See replay-child tests for
controlled GM/media/clock evidence; no actual browser popup or platform PASS claimed.
Artifact SHA-256: 53471e8354badc3b2a7ee32fd34c2f915a608a77b437a25e9abf46b25f87d2ad.
Reference fork and optional companion remain untouched. Stop after one XXT/main commit.
Historical migration details below are retained, not current artifact hashes/counts.

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
