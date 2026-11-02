# Fork migration audit — PARTIAL

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
