# XXT handoff

## Identity / acceptance

- Repository https://github.com/RXY712200/XXT; canonical root `D:\XXT`; branch `main`.
- Phase I accepted: `dc3232040fa4df30ae58eeb08ebc102f2b06942e`.
- Phase II accepted and Phase III starting baseline:
  `2428489a83d147542b6e318d0bcaeaa6b9766b01`.
- Phase III Steps 05/06: implemented candidate, PENDING independent ChatGPT review.
- Resolve latest SHA with `git rev-parse HEAD`, compare
  `git ls-remote origin refs/heads/main`. Report supplies exact delivery SHA;
  do not hardcode this file's own commit hash.
- Phase IV/V NOT started; fixed five phases / ten steps retained.

## Current source / contracts

- `D:\XXT\src\adapters\video.js` and `audio.js`: separate opt-in adapters/settings.
- `D:\XXT\src\adapters\media.js`: shared owned native media effects/recovery.
- `D:\XXT\src\runtime\media-session.js`: explicit media session assembly.
- Existing `src/platform/inventory.js`: read-only ordered ownership/evidence;
  now also reports normalized source and page URL for readiness validation.
- Existing `src/core/coordinator.js`: one scheduler/active task; new STARTING
  scheduled checks, cancel handles, startup activation handshake and bounded
  same-owner missing-player readiness. Completion/navigation policies unchanged.
- No production bootstrap/installable/generated userscript; no artifact hash.
- Other existing platform/core/runtime responsibilities documented in PHASE_II.md.
- See PHASE_III.md for precise recovery limits, contract changes and evidence.

## Verification / limitations

- `npm test`: all 32 prior cases retained plus 17 new media cases = 49 synthetic
  tests. Simulated media state/events/time are not browser playback evidence.
- `npm run check`: syntax/imports, relative production imports, no unauthorized
  navigation/readers/network effects. Native play/pause confined to media.js.
- `npm ls --omit=dev`: empty. No new dependencies; jsdom remains dev-only.
- `node scripts/browser-media.mjs`: actual local headless Chrome with generated
  WAV and native audio/video elements, no autoplay/security override flags.
  Audio audible+muted attempts were denied; zero completion. Video element with
  the same audio track played muted and naturally ended once, at 1.0x, no timers
  left. Synthetic ownership context, not actual course video or authenticated DOM.
- No real OS/application switching, background tab throttling or Tampermonkey
  acceptance. Browser policy may reject muted audio; unattended success not promised.
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
