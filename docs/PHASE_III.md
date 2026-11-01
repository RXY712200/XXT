# Phase III — video/audio candidate

Accepted Phase II baseline: `2428489a83d147542b6e318d0bcaeaa6b9766b01`.
Steps 05 and 06 are one implementation delivery pending independent review.
Reviewed candidate `d76b474a88a25c0afc612206f59476bc60f01b11` FAILED targeted
acceptance. This correction remains pending independent review.
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
- Unverified/missing-source readiness waiting: 5000ms maximum. A verified declared
  source permits native play at readyState=0, including preload="none". One 250ms retry after transient startup
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

- `npm test`: 56 synthetic cases, including all 32 unchanged Phase II tests and
  24 media/recurrence tests. Real jsdom elements use simulated play/state/events/clock;
  this does not establish native autoplay permission or authenticated compatibility.
- `npm run check`: syntax of 19 files, import evaluation of 12 production modules;
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

## Targeted acceptance correction A/B/C

A: The unconditional readyState<1 gate prevented play-triggered initialization.
The adapter now invokes native play when an independently captured source identity
is usable, without requiring metadata. Its existing 5000ms play watchdog, policy
fallback, AbortError budget and STARTING handshake remain intact. Missing or
ambiguous source declarations do not gain authority from readyState alone and
retain bounded waiting. No load(), seek or currentTime writes were introduced.

B: `src/platform/media-source.js` provides one contract for the reader, adapter
and coordinator. A usable source is one normalized HTTP(S), blob or media-data
URL declared by src or child sources (or an already selected initial currentSrc).
This verifies source identity, not codec/network success; native play decides
whether playback succeeds. Declaration nodes, attributes, types, media conditions
and base URI are pinned. Multiple distinct URLs, invalid selections and srcObject
are unsupported. Initial empty currentSrc may select only that declared URL;
an already selected source stays pinned. Declaration/element/frame/context or
unapproved currentSrc changes invalidate authority. Cleanup uses the same
contract so valid initial selection can still be paused on Stop; replacements
are not controlled as the old source. Missing initial identity requires a fresh
verified scan to adopt later unknown declarations; it is not guessed in place.

C: The existing scheduler adds `recurring(action)`: one key/record, one pending
arm, no overlapping async callback, per-arm epoch protection. Context exposes
scoped scheduleRecurring only in RUNNING. The media monitor uses one such key,
not a new one-shot key each second. Cancel/Stop/invalid context are final; old
arm callbacks cannot execute a newer arm. Ordinary one-shot keys remain permanently
single-use; no global tombstone eviction or second timer subsystem exists.

Seven additional focused cases cover preload-none video/audio at readyState=0,
child source selection with unchanged inventory revision, ambiguous/replaced
sources, Stop during initialization, 3000 monitor ticks with constant history,
nonoverlap/stale recurring callbacks and continued one-shot deduplication.
Three existing readiness fixtures changed for a reason: source-present delayed
startup now waits on a native play promise; true missing-source timeout and
pre-start-ended cases remove src before binding. Completion and navigation
expectations were not weakened; their original Phase II tests are unchanged.

The native smoke now starts both elements with preload="none", a declared WAV
child source and readyState=0, without waiting for metadata. Chrome denied audio's
audible and muted attempts (zero local completion); video selected the declared
source, progressed and naturally ended once at 1.0x with no pending actions.
This is a limited native API/initial-source check with synthetic ownership,
not authenticated platform, real video pixels or background OS-switch evidence.
