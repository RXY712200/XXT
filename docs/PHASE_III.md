# Phase III — video/audio candidate

Accepted Phase II baseline: `2428489a83d147542b6e318d0bcaeaa6b9766b01`.
Steps 05 and 06 are one implementation delivery pending independent review.
Status PARTIAL: no authenticated Chaoxing acceptance. Phase IV/V not started.
MASTER_PLAN's five phases and ten steps remain unchanged.

## Canonical source and assembly

- `D:\XXT\src\adapters\video.js`: independent enabled/background options and
  verified video descriptor; no unrelated UI invariants.
- `D:\XXT\src\adapters\audio.js`: independent audio options and descriptor.
- `D:\XXT\src\adapters\media.js`: shared native effects/recovery with no navigation
  or platform writes. It never assigns currentTime, duration or server credit.
- `D:\XXT\src\runtime\media-session.js`: explicitly acquire the existing single
  page session with both descriptors. First acquisition owns options; acquiring
  again cannot replace an existing coordinator or its settings.

Explicit integration example (not a browser bootstrap or installable):

```js
const session = acquireMediaSession(document);
const snapshot = session.inspect();
session.coordinator.bind(snapshot);
if (snapshot.status === 'verified') session.coordinator.startNext();
else session.coordinator.waitForMedia(() => session.inspect());
```

The engine does not add automatic next-task loops or native navigation. Callers
must explicitly request the next eligible task through the coordinator. The
existing failure/unknown boundaries and independent completion gates still apply.

## Core integration and policy

Scheduled actions may run in STARTING as well as RUNNING: readiness checks and
play-promise watchdogs must be owned before startup completes. Context now exposes
`isCurrent`, `now`, `cancelScheduled`; all still use the one existing scheduler.
Start resolves to a cancellation handle; core enters RUNNING before calling its
optional `activate()`. Only then may a buffered genuine ended result reach done.
An early event followed by rejected play never earns a local completion result.
Generic Phase II fake adapters without activate retain their existing behavior.

`waitForMedia(readSnapshot)` only accepts a loading-player inventory with existing
uniquely identified owners. It polls every 100ms for at most 5000ms, with duplicate
request suppression. Fresh reader-branded evidence must retain course/page URL,
lesson/catalog identities and nodes, task order/owners/frame paths, existing
documents/players/sources. Changed/unsafe scope cancels rather than adopting it.
Late outer course frames or entirely missing ownership still require an explicit
fresh scan; there is no unbounded automatic page-loader or guessed ownership.

Source normalization prevents a relative src becoming an equivalent absolute
currentSrc from invalidating ownership. Actual changed sources remain invalid.
Completion evaluator, navigation gate, state table and scheduler implementation
are unchanged from accepted Phase II.

## Media behavior and bounds

- Promise fulfillment, not invocation, establishes running playback. Paused
  fulfillment, errors and unsupported media fail; synchronous exceptions are caught.
- Exactly 1.0x default/current playback rate on start, recovery and ratechange.
- Audible first. One muted retry only for NotAllowedError; never automatically
  unmute later. Dual rejection remains unresolved; no fake interaction or flags.
- Metadata readiness: 5000ms maximum. One 250ms retry after transient startup
  AbortError. Other errors fail distinctly. Each play promise has a 5000ms watchdog.
- Real ended event requires current owned element's ended state; loop media and
  pre-existing ended players do not manufacture completion. Duplicate callbacks
  are rejected. Platform credit is still independently required for navigation.
- Pause recovery is immediate when safe. Focus/blur/visibility/mouse-leave and
  stalled checks read actual pause/progress and do not interrupt healthy playback.
  Listeners cover player and owned outer/frame documents/windows, never spoof events.
- One-second monitoring; 8000ms without observed progress permits a stall retry.
  Minimum 3000ms between recovery starts, at most three recoveries per execution.
  Repeated recovery exhaustion fails unresolved rather than refreshing or skipping.
- Background option defaults true, independently configurable per adapter.
  Disabling it suppresses automatic pause/stall/focus recovery, not ownership/rate
  or error checks. No settings UI is introduced.
- Abort/disposal removes all listeners, cancels adapter-owned scheduled actions,
  and pauses only the unchanged owned element (also aborting pending native play).
  No unrelated or replacement player is paused. Late callbacks cannot authorize work.

## Tests and actual evidence

- `npm test`: 49 synthetic cases, including all 32 unchanged Phase II tests and
  17 new media tests. Real jsdom elements use simulated play/state/events/clock;
  this does not establish native autoplay permission or authenticated compatibility.
- `npm run check`: syntax of 17 files, import evaluation of 11 production modules;
  no external production dependency or unauthorized browser actions. Scope guard
  now allows play/pause only in media.js; still forbids native navigation/readers.
- `npm ls --omit=dev`: empty; no new dependency or lockfile change.
- `node scripts/browser-media.mjs`: headless installed Chrome, isolated ignored
  `.local/` profile, localhost modules, generated one-second WAV. No userGesture
  injection, autoplay override, permission override or security-disabling flags.
  Audio's audible and muted attempts both received policy denial: no completion,
  no leaked pending timers. The video element containing that audio track played
  muted, progressed naturally, ended once at 1.0x and cleaned all timers.

The initial browser smoke assumed muted audio would succeed and failed on actual
policy denial. That assumption was corrected: the final harness verifies either
real natural completion or the explicitly required safe dual-denial outcome.
This is not a workaround or evidence that unattended audio playback succeeded.
A separate harness page-load race was fixed by awaiting Page.loadEventFired.

Native smoke uses a synthetic ownership context and WAV media; it does not test
actual video pixels, the full platform inventory/coordinator in Chrome, course
credit, user OS-window switching, real tab throttling or manager isolation.
Background event/clock evidence remains synthetic. Browser policies can prevent
unattended audio; real Chaoxing wrapper/player/source and credit patterns require
user testing. No browser-policy bypass or stronger compatibility claim is made.

## Acceptance gate

Feature matrix media rows remain PARTIAL, with source/synthetic/native evidence
distinguished. HANDOFF records Phase II acceptance and this candidate. No document
reader, replay/GM/popup, native catalog action, UI/rest system, package/userscript,
reference-code import or deployment is part of this change. Independent ChatGPT
acceptance and new authorization are required before Phase IV.
