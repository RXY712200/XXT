# XXT handoff

## Identity / acceptance

- Repository https://github.com/RXY712200/XXT; canonical root `D:\XXT`; branch `main`.
- Phase I accepted: `dc3232040fa4df30ae58eeb08ebc102f2b06942e`.
- Phase II accepted and Phase III starting baseline:
  `2428489a83d147542b6e318d0bcaeaa6b9766b01`.
- Phase III Steps 05/06: NOT accepted. Candidate `d76b474a88a25c0afc612206f59476bc60f01b11`
  failed targeted review. This correction remains pending independent acceptance.
- Resolve latest SHA with `git rev-parse HEAD`, compare
  `git ls-remote origin refs/heads/main`. Report supplies exact delivery SHA;
  do not hardcode this file's own commit hash.
- Phase IV/V NOT started; fixed five phases / ten steps retained.

## Current source / contracts

- `D:\XXT\src\adapters\video.js` and `audio.js`: separate opt-in adapters/settings.
- `D:\XXT\src\adapters\media.js`: shared owned native media effects/recovery.
- `D:\XXT\src\runtime\media-session.js`: explicit media session assembly.
- Existing `src/platform/inventory.js`: read-only ordered ownership/evidence;
  shared `media-source.js` verifies declarations/initial selection and page context.
- Existing `src/core/coordinator.js`: one scheduler/active task; new STARTING
  scheduled checks, cancel handles, startup activation handshake and bounded
  same-owner missing-player readiness. Completion/navigation policies unchanged.
- `src/core/scheduler.js`: one fixed-key recurring action with arm epochs; no
  per-tick historical growth. Ordinary one-shot keys remain single-use.
- No production bootstrap/installable/generated userscript; no artifact hash.
- Other existing platform/core/runtime responsibilities documented in PHASE_II.md.
- See PHASE_III.md for precise recovery limits, contract changes and evidence.

## Verification / limitations

- `npm test`: all 32 Phase II cases unchanged; 24 media/recurrence cases = 56
  synthetic tests. Three old readiness fixtures were corrected to distinguish
  source-present native startup from truly missing-source waiting. Simulated media state/events/time are not browser playback evidence.
- `npm run check`: syntax/imports, relative production imports, no unauthorized
  navigation/readers/network effects. Native play/pause confined to media.js.
- `npm ls --omit=dev`: empty. No new dependencies; jsdom remains dev-only.
- `node scripts/browser-media.mjs`: actual local headless Chrome with generated
  WAV child <source>, preload="none", initial readyState=0; no policy override flags.
  Audio audible+muted attempts were denied; zero completion. Video element with
  the same audio track resolved its declared source, played muted and ended once
  at 1.0x, no timers
  left. Synthetic ownership context, not actual course video or authenticated DOM.
- No real OS/application switching, background tab throttling or Tampermonkey
  acceptance. Browser policy may reject muted audio; unattended success not promised.
- Declared unique URL may select into currentSrc without changing revision;
  changed declarations/selected URL/player/frame or srcObject remain invalid.
- Missing/ambiguous source cannot establish identity; bounded wait or explicit
  fresh scan is required, never automatic adoption of an unapproved source.
- 3000 simulated healthy monitor ticks retain a constant scheduler record count.
- Unsupported, unknown, replaced, competing or exhausted content remains unresolved.
- MASTER_PLAN unchanged; feature rows advance only to scoped PARTIAL evidence.

## Protected decisions / next gate

- One coordinator/scheduler; no adapter catalog authority or platform-credit writes.
- Local natural end is not platform completion. Own platform markers remain required.
- Fixed 1.0x; no seeking/progress fabrication; healthy playback is not interrupted
  by focus events. Stop aborts pending operations/listeners/timers and owned playback.
- Recovery bounded: 5000ms readiness/play-promise watchdog, one policy muted
  fallback, one startup AbortError retry, three runtime recoveries with cooldown.
- Explicit Stop remains session-scoped; durable reload recovery/pacing/UI are Phase V.
- No reference implementation/tests/fixtures/history imported; reference repos and
  Quiveld untouched. No private data, PR/issue/tag/release/workflow or website upload.
- STOP after Phase III publication. Phase IV requires independent ChatGPT review,
  acceptance and new explicit user authorization. Reader/live DOM/grants and
  packaging remain future decisions; no automatic scope extension.
