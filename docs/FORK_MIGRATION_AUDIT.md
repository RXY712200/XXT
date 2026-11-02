# Fork migration audit — integrated follow-up / PARTIAL platform acceptance

## Current reconciliation of restored local state and prior credit

Reviewed baseline `8c246e433cc68ae626a8600e570486598e3875bd`. The three accepted
state-consistency repairs remain. Browser mode selection previously included
RESTORED_WAITING_PLATFORM as a reason to select completed mode. That mode requires
individual task markers or current-generation ended, whereas a fresh identical
credited lesson could use prior-credit. Persistence history was imposing an
extra evidence requirement unsupported by the accepted whole-lesson contract.

Only `runtime/browser.js` production logic changes: independently evaluated fresh
positive whole-lesson credit selects prior-credit; local waiting presence does
not select the evidence path. Gate, evaluator, private/expiring/single-use permits
and fresh consumption/acknowledgement are unchanged. Contradictory/incomplete
task evidence, unknown/assessment/verification, active media and unsafe targets
still deny. No marker means no permission, regardless of stored local results.

`tests/restored-credit.test.js` adds nine actual-runtime scenarios: fresh,
restored and current-generation end with lesson-only credit; restored with both
markers; absent marker/text only; contradictory/incomplete tasks; unknown,
assessment, verification and active media; stale lesson/changed target during
delay; Stop/reload. Positive handlers replace catalog/content and the native port
independently acknowledges destination, with exactly one activation/no replay.
The old state-consistency assertion now expects one navigation after markLesson(),
not zero. Its uncredited wait, no replay, restored-state and Stop checks remain.
All 116 earlier scenarios retained; 125 total pass. Native Chrome smoke remains
controlled synthetic/native evidence, not authenticated platform acceptance.
Canonical artifact hash/results are in HANDOFF. No new source reuse or privileges.

## Current state-consistency repair (supersedes affected boundaries below)

Reviewed candidate `0a93c2b7e12c051c1e5920a76b2227843862b3a4`.
The migration is not restarted. Three integration defects are corrected:

- **Loading recovery:** the old credited-only condition rejected unfinished
  same-lesson iframe reconstruction. Runtime now validates the old owned scope
  plus current course/lesson/catalog, cancels old work and reserves a persisted
  readiness attempt through `beginReadinessWait()`. Existing scheduler polls for
  at most 10s. Attempt 3 retains terminal/no-reload behavior. Fresh content must
  independently match attachment keys, owner identity, ordinal, kind and usable
  media source; it must be inactive and free of unsafe/verification tasks. Prior
  credit is still required to continue a previously credited item. No old media
  object or local result is reused as a completion proof.
- **Atomic deferral:** `coordinator.deferUnknown()` checks idle, valid exact
  inventory and queued/active navigation before a synchronous persistence callback.
  The callback validates/persists that same exact unknown-key decision; only then
  does the coordinator grant deferral. `partial.defer()` uses immutable next state
  and publishes its private copy only after successful native storage write.
  Unknown tasks remain unresolved and cannot authorize lesson departure.
- **Restored local state:** `RESTORED_WAITING_PLATFORM` distinguishes persisted
  local-ended evidence from fresh PENDING and current-generation WAITING_PLATFORM.
  No invented execution history. The initial runtime policy required fresh own
  task credit for restored records; the reconciliation above supersedes that mode
  choice while keeping the navigation gate/evaluator unchanged.
  Chinese status/local-result display remains separate from whole-lesson credit.

New `tests/state-consistency.test.js` contains 12 actual-API/application tests;
all 104 earlier scenarios remain. The earlier immediate-Stop loading assertion
was extended to finite wait then Stop, retaining no replay and deadline failure.
The generated-runtime credited-video/correct native acknowledgement regression
still passes. Native Chromium adds real iframe/storage/UI integration with mocked
playback; it does not prove platform or autoplay compatibility. 116 tests pass.

The existing recovery factory body is retained except the narrowly added readiness
reservation operation; this is no longer an entirely byte-identical extraction.
Playback engines, source verification, completion/navigation architecture, adaptive
reader, scheduler, developer replay module and five-phase plan are unchanged.
No new source reuse, private fixture import, reference edits, grants or companion.
Remaining trusted-live/proprietary-reader dependencies below are unchanged.

## Current delivery (supersedes the historical limited-delivery section below)

XXT baseline `36aa62cfaae9cca2d5c9caafcea34e0a796b27be`, authorized target main.
All source references in this table are to fork **351c08dc4d772908c3d098e8c9160be434bf1064**,
compared against upstream **9a23b357875a72ed9bfd9e652257b0849a6855d7**.
Both reference checkouts remain read-only. No old Git ancestry, raw/private fixtures,
or complete mixed-origin playback methods were copied. User-added code and the
separable user-developed portions are reused under the explicit authorization.

| Legacy functions / history | Actual reuse, integration and tests | Implementation boundary | Separate live-evidence gap |
| --- | --- | --- | --- |
| `catalog.status()` | Prior delivery's direct extraction `platform/fork-credit.js` retained byte-for-byte; evaluated alongside XXT contradiction/ownership checks | No new credit evidence | Actual course marker patterns still need user testing |
| `_observeCredit`, `_priorCompletionValid`, `_checkPriorCompletion`, `_continueCompleted`, `_completeVideo`, `_catalogTopology`, `_refreshVideoContext`, `_beginCatalogTransition`, `_queueNavigation`; d7ea26ac / 94b26728 | Adapted user-authored logical-identity/credit continuity in `runtime/browser.js`; original inventory positive catalog rebind, completion gate, navigation permits, native acknowledgement retained. `migration.test.js` + generated-runtime case in `migration-remaining.test.js` | Bounded 10s reconstruction only for prior credited known content; fresh positive proof + same ordered identities/topology required. Timeout/unknown/competing/verification stops. No copied upstream complete method | No authenticated navigation result claimed |
| `_partialSession`, `_partialSelect`, `_partialEvent`, `_waitPartialTasks`, `_processSupportedTask`, `_recheckCurrentLesson`; 4cd9f48c / e2d33dcd / 94b26728 / be35bec5 | Adapted durable ordered scope/local result/explicit deferral to `runtime/partial.js`, existing coordinator `restorePartial`, `browser.deferUnknown()` and Chinese manual control. Actual app persistence/corrected task/reload tested | Deferred unknown remains unsupported; never navigation authority. Rescan retains only exact unchanged content descriptors. Failed known-task continuation retains existing explicit coordinator policy; runtime does not silently bypass failed audio | Actual mixed layouts and platform markers unverified |
| `createUnattendedRecoveryCoordinator`, `_recoveryEntryAllowed`, `_partialPauseApplies`; 93f17b8d / ff2592cf / ec010563 / 2b444b2c | Direct user-added factory extraction `runtime/fork-recovery.js`, namespace/clock adaptation; browser hooks use SAME coordinator scheduler. Runtime eligibility/persisted terminal guard adapted, not old monolithic app. Actual app terminal reload/reinjection, direct budget/late progress/missing identity tests | Attempts 1/2 rebind; attempt 3 stops because safe reload is disabled. No automatic reload or second scheduler. Explicit Stop distinct from terminal exhaustion; unknown/assessment disallow recovery | OS switching/real frame replacement still unverified |
| `_prepareAudio`, `_audioPlayRejected`, `_audioExhausted`, `_audioFollowingTask`, `_discoverAttachmentTask`, `_classifyAttachmentReadiness`, `_waitForAttachmentReadiness`; b880e877 / 0c07d13e / 351c08dc / 706a8616 | Equivalent `adapters/media.js`, audio/video wrappers, inventory and ordered coordinator retained byte-for-byte in playback. Existing media/core tests exercise success, same-owned muted fallback, dual denial, AbortError/readiness, ownership, failed-then-known explicit policy, natural end and independent credit | No duplicate playback engine. Browser policy refusal stays unresolved; no runtime automatic traversal past failed required audio | Native Chrome audio denial is observed honestly, not a platform PASS |
| `readDocument`, `_waitForDocument`, `_documentContextValid`; 81b4c38f / 36b196eb / 1f494175 / a3099858 | Adapted user-developed one 5000–7000ms trajectory and measured-range formula in `adapters/document.js`; existing unique HTML geometry, readiness/cancellation/stable-bottom retained. Mixed tests + both traversal bounds + native HTML smoke | Only accessible uniquely scrollable HTML; existing position not rewound. Sampling/stable bottom can extend elapsed time beyond sampled trajectory. Proprietary PDF/knowledge-map execution not invented | Actual inner viewer geometry not established |
| `createGMLive`, native replay lifecycle; gm-live/bridge/native-entry/recorded-live historical suites | Adapted private-capability state logic in `runtime/replay-lifecycle.js`: claim/ack, separate child pulse, pending 120s/child 180s deadlines, 4h expiry, explicit retry, no displacement, single terminal, refresh-once guard. API behavioral tests call real module. Existing native user-entry/observer tests retained | **Developer-only, unbundled infrastructure**, no installed GM transport/companion. Grant-none page context cannot establish privileged sender provenance. No automatic return, real self-close, refresh or pacing integration is enabled. A reviewed isolated GM capability + verified child identity/player binding is a concrete dependency; source GM code cannot be transplanted silently | Real userscript-manager isolation, pairing and tab-close permission are unverified; separate from the intentionally unwired transport dependency |
| `createTaskPacingCoordinator`, per-action scheduler, journal/risk planning; 97952cac / 7faceb28 / 8c657405 / e0c41449 / 5ee97211 | Adapted category ranges and decision persistence in preferences/diagnostics/panel; equivalent single scheduler, exact-key persisted count/rest retained. New category/journal tests + existing product/scheduler tests | No new random quota algorithm; existing configurable quota/rest retained. Rest suppresses short start delay until expired; one category per transition, chapter precedence. Journal contains only category/state/kind, no completion authority | Real throttling/pacing not authenticated evidence |

### Exact historical commit references

The abbreviated identifiers above resolve in the pinned read-only history:
`4cd9f48c54ea2b3045defe949756fca8ee7e5d1b`,
`e2d33dcd1e529b624dafddbb19cedb9ca9139c6b`,
`94b26728e3350438645bc59f6476610f5c6927ab`,
`be35bec5a4473a92139f98577bd8d65912f60838`,
`93f17b8db65ddf51bb260832081f5d3709adb353`,
`ff2592cf4df15037eb45cd07194e3d9a33e0574d`,
`ec0105633c6998583e00300f9c880702da12a08a`,
`2b444b2c4f81d9ec65bf2b4593f83bd654770806`,
`b880e877702258a744ab5a4fd8bb0ec56e3a50df`,
`0c07d13e4d964a7d6f3169e771cf56c2b890ac23`,
`706a8616981a006abe5ee615fb8dac9b6ebf49a9`,
`81b4c38f0c1d3c20c3de910ef4b77c6a33243efa`,
`36b196eb03d5a96cb4c80a1abb28f33772d1fc94`,
`1f494175915bb17285769c722d5fc44498148c79`,
`a3099858781b1f3d550a9b6400389dfda3f3247e`,
`97952cac703f2e27dab3046f1848252cb24325c4`,
`7faceb2858e0e08cd674ddf6cb079f7d23dea3a9`,
`8c6574050eaaa6232c95a04e74f08de9c807a28f`,
`e0c414497a2c091515a1356549d64870fbae5c07`,
`5ee97211889c93c402047eefac3bef90d40fb0e2`.

### Historical regression mapping and current evidence

All 92 baseline tests are retained without edits. New tests call real XXT APIs;
none evaluate a disconnected copy of an old helper. Original test files/assertions
were read, but the legacy scripts themselves are NOT run against XXT's different APIs.

| Historical suite reviewed | Ported behavior / executing XXT tests |
| --- | --- |
| navigation-v3 | Generated startup with owned credited video still present, completion banner, own marker, multi-chapter catalog, delayed missing/rebuilt iframe + catalog, no replay, one real native handler and independently acknowledged destination; credit negatives/timeout in migration-remaining; baseline core/platform navigation |
| audio-failure-v3 | Existing media tests: audible success, one fallback, double denial, readiness, replaced media, explicit known-only failure continuation; mixed runtime persistence/recheck added |
| bridge-v3 | Existing mixed tests reject forged messages, close no unowned tab, stale/early-close observation; no positive forged-provenance test disguised as a trusted result |
| gm-live-v3 | New replay lifecycle API tests: wrong course/duplicate claim, claim/ack, independent child heartbeat, two-hour simulation, bounded lost-child cancellation, explicit retry, expiry, no live-child displacement, natural-ended proof callback, single terminal, one refresh, completed no reopen |
| native-entry-v3 | Existing mixed/platform native card recognition and trusted-event boundary retained; missing destination never guessed |
| recorded-live-v3 | Existing observer distinguishes finite/unknown duration, natural end vs near end, premature owned closure and stale messages; no duration/closure credit |
| task-pacing-v3 | Direct migrated recovery budget tests + actual app terminal bootstrap; category integer bounds/independent sampling/disabled draws, durable unique counts/rest baseline product tests |
| customization-v3 | Existing fixed 1.0x settings, independent controls and unsupported/assessment boundaries retained |
| preserved-v3 | Byte comparisons to XXT baseline for media/audio/video, platform inventory/fork credit, completion/navigation, scheduler, native tabs/navigation, live adapter and metadata; behavioral baseline tests retained |

Current exact commands/results and artifact hash are in HANDOFF and RELEASE_READINESS.
Two-area UI remains top-right collapsible settings + bottom-right notice; only
requested category controls and explicit unknown-deferral action were added.
Fresh eligible navigation is **ON**; saved false and Stop survive schema migration.
Local partial keys/identities stay in same-origin storage, never diagnostic exports.
No private snapshots, credentials, reference modifications, companion install,
grant expansion, stable release or authenticated Chaoxing acceptance is claimed.

## Historical limited delivery (superseded; evidence of what was missing then)

Target starting SHA `11796ff3883e3749bef78896d7ac4fd519564066` (XXT/main).
Read-only source RXY712200/xuexitongScript review branch pinned to
`351c08dc4d772908c3d098e8c9160be434bf1064`; upstream provenance baseline
`9a23b357875a72ed9bfd9e652257b0849a6855d7` is its ancestor, with 59 intervening
commits. Git numstat confirms v3_optimized.js +3087/-209. Source repositories
were not modified. No source history or private authenticated fixtures imported.

The user's current reuse authorization supersedes the old blanket prohibition.
This delivery is a limited coherent P0 integration, NOT completion of the requested
comprehensive migration. Remaining requirements below are not silently removed.

| Old implementation / provenance | Origin | Reuse/target | Status and regression |
| --- | --- | --- | --- |
| catalog.status, v3_optimized.js at pinned fork; absent upstream | User-added | Direct body extraction with export wrapper: src/platform/fork-credit.js; consumed by core/completion.js alongside stricter XXT contradiction checks | Migrated; own marker/zero-count/message/contradiction tests |
| _priorCompletionValid, _catalogTopology, _refreshVideoContext; d7ea26ac3735, 281eda39002b, 24c7d3b9b578 lineage | User-added logical identity controls | Adapted detached-node/topology guards in platform/inventory.js; media/frame/source remain exact | Positive-credit catalog rerender supported; unfinished catalog replacement still conservatively invalidates |
| Explicit credited attachment removal/recheck, 94b26728e335 | User-added / changes within existing execution methods (category B) | Guard logic adapted into runtime/browser.js before stale-scope stop; fresh independent completion evaluator retained | Known removed attachments can rebind only with positive whole-lesson credit and identical logical catalog; unknown disappearance blocks |
| _observeCredit/_checkPriorCompletion | User-added | Existing XXT recurring fresh evidence reader retained, not a copied second observer | Runtime continuously reads credit; separate bounded legacy observer budget not ported |
| _completeVideo/play/run edits within inherited methods | Mixed-origin, includes user rewrites | Existing XXT natural-end/credit separation retained; no inherited whole method transplanted | Partial: exact category-B end-to-navigation blocks not fully extracted |
| _partialSelect/_partialEvent/durable pause, 4cd9f48c54ea/e2d33dcd1e52 | User-added | Existing ordered known-task coordinator retained | Durable unknown deferral and explicit persistent recheck still NOT migrated |
| Audio failure/readiness, 351c08dc4d77, tests/audio-failure-v3.mjs | User-added portions in mixed-origin methods | Existing equivalent promise/fallback/readiness/recovery retained | No direct audio transplant; broader failure-following/deferred integration incomplete |
| createUnattendedRecoveryCoordinator, terminal recovery history | User-added | Persistent Stop and bounded XXT readiness/recovery retained | Legacy persisted three-attempt terminal state machine not transplanted |
| readDocument/adaptive reader, 81b4c38f0c1d/a3099858781b | User-developed additions | Existing HTML-geometry reader retained | Adaptive 5–7 second traversal/knowledge-map executable coverage NOT migrated |
| Special reader classification | User-added | Existing structural recognition retained | Recognition-only; proprietary execution/credit unavailable |
| createGMLive / companion, gm-live-v3.mjs and bridge-v3.mjs | User-added but privileged/transport-dependent | Existing fail-closed manual boundary retained | GM transport/companion NOT migrated; no added grants/installable |
| Pacing/settings/journal, task-pacing-v3.mjs | User-added | Existing XXT exact-key counting/rest/allowlisted diagnostics retained | Per-action categories and durable deferral journal not transplanted |
| Upstream focus guards/monolithic playback | Inherited or mixed | Existing XXT native media implementation retained | Deliberately no blind inherited-method copy; not a claim all category B unavailable |

## Historical coverage reviewed and adapted

Inspected actual assertions from navigation-v3 (prior credit/catalog rerender/
removal), audio-failure-v3 (bounded fallback/readiness), and gm-live-v3 (claim/ack,
natural end, wrong course, expiry). The catalog-rerender synthetic fixture was
reviewed read-only. New migration.test.js adapts the first group's observable
regression logic to actual XXT APIs; it does not execute disconnected old globals.
Existing XXT tests cover media/source-present behavior, mixed order, Stop/rest,
forged messages and native entry. Bridge/native-entry/recorded-live/pacing full
historical suites were NOT ported or claimed executed. No old fixture was copied.

## Safety, defaults and remaining work

Fresh configurations enable eligible navigation as explicitly requested. An
existing saved navigation:false remains false, including persisted Stop. Catalog
rerender does not alter current content/iframe/source identity; only detached
catalog members with unique stable keys/order/titles/chapter and positive credit
can be substituted. No title text such as 任务点已完成 alone becomes credit.
Removed unknown tasks never become completed by disappearance. Verification,
inaccessible frames, competing media and contradictory evidence still block.

The two-area UI, media, scheduler and current source safeguards are retained.
No automatic trusted-message inference, unowned closing, grant expansion or
companion deployment. Full category-B extraction, durable deferral, terminal
recovery and GM lifecycle integration remain open implementation work, distinct
from authenticated validation. Live privilege/ownership and proprietary reader
structures additionally require reviewed concrete evidence. This is not a legal
ownership determination for every historical line or a stable-release claim.

Final verification: 92 PASS / 0 FAIL (87 prior + 5 migration cases), syntax 40,
imports 25; no production dependencies. Build/byte verification and native Chrome
smoke passed. Generated entrypoint prior-credit-to-native-navigation regression
executes the actual bundled runtime on sanitized DOM, not a disconnected helper.
Artifact SHA-256: ddbb547dffd1f15a746b8961008e89543437689ff072c05e340231b2b02120dd
