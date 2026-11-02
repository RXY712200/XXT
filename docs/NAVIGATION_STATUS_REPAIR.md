# Navigation / runtime status evidence ledger

Baseline: `7c5767b1fc9a724618a114cd2a755b9088012808`.
Candidate only; no authenticated compatibility or stable release acceptance.

## Demonstrated defects and scope

1. Regular navigation selected the adjacent catalog node. Existing optional-test
   mode required a different chapter. This did not implement the owned fork's
   same-chapter `_targetAfter` / `_assessmentTarget` behavior.
2. Browser logged `navigation` even if the queue rejected the request. Legacy
   events often supplied no state/kind. Those records prove neither a click nor
   successful destination acknowledgement. A positive marker is not a permit.
3. Bottom-right rendered only `message`; operational information stayed in upper
   settings and no real deadline was projected. Using `100vw` on a tall page also
   caused a 7px left overflow at 320px because it included the vertical scrollbar.
4. Top-document load capture alone cannot reliably notice an inner document
   replacement. The native port now observes all scoped document loads/mutations
   and uses shared-scheduler 100ms observation, bounded by the original deadline.

These are controlled source/fixture findings. The user's historical v1 journal
does not establish which defect caused that authenticated stop.

## Actual reuse and navigation contract

Fork pinned to `351c08dc4d772908c3d098e8c9160be434bf1064`; methods at approximately
1683–1706 and intent/deadline controls at 2134–2203 / 1580–1588 were inspected.
`_assessmentTarget` and `_targetAfter` are user-added, absent from upstream
`9a23b357875a72ed9bfd9e652257b0849a6855d7`. Separable title predicates and the
consecutive-optional traversal are adapted into `platform/fork-target.js`.
XXT adds an eight-node ceiling and explicit numbered-prefix normalization.
Existing permission, topology/source evidence and deadline architecture is reused;
no inherited monolithic playback method or second navigation engine is imported.

Only exact optional names may be deferred. A mandatory/unknown exam, verification,
restriction, unresolved source task or contradictory credit blocks. Target keys,
ancestry/order and the deferred sequence are reread when issuing/renewing/consuming
the branded permit. Same-chapter learning is permitted; assessments stay unfinished.
Prior-credit reconciliation and restored-vs-current local states are preserved.

Native activation is attempted once. Returning from `click()` is an observation,
not success. Target/course identity and stable catalog topology must match; an
independently changed owned content document/task must also be observed. Harmless
unique node reconstruction can rebind. Duplicate/mismatched owners fail closed.
The default acknowledgement budget remains 3000ms. 2600ms controlled loading
passes; after-deadline loading is rejected. No timeout extension hides a miss.

## Presentation and deadlines

`runtimePresentation()` is a pure read-only projection of coordinator records,
pending scheduler keys/deadlines, `pendingContext.until`, `tabPending.until`, recovery
status and stored rest deadline. It neither samples randomness nor schedules work.
The existing 500ms runtime watch updates countdowns; acknowledgement observation
uses the same coordinator scheduler. Stop clears active presentation countdowns
while preserving underlying durable rest/Stop state.

The neutral bottom-right panel shows phase/action, kind/ordinal, known count and
local-ended count, independent platform status (including contradictory/unavailable),
running/local/restored/unresolved result, upcoming action, real remaining time,
recovery attempts, rest and an allowlisted reason/manual instruction. No invented
overall percentage. Primary rows/quick controls stay visible; settings/exports stay
in the separate collapsible upper panel. Countdown rows use `aria-live=off`; the
polite headline changes only when the message changes, not on every timer tick.

## Versioned diagnostic schema

Export: `xxt-diagnostics-v2`, maximum 100 events. The existing namespaced storage
key `xxt.decisions.v1` now holds `{version:2, events:[...]}`; old clean arrays migrate.
Old rows retain their category/state/kind and receive `stage:legacy`,
`reason:legacy-unrecorded`, `outcome:unknown`, `atMs:null`. No missing reason is inferred.

Each v2 event has allowlisted category, state, kind, phase, reason, stage, outcome,
deadlineKind, retry (0–3), bounded relative `atMs` and ordered `order`. Time is
relative to the current runtime, not an absolute timestamp; order persists across
reload. Unknown fields/reasons are not copied. No course/student/account IDs,
URLs, media metadata, arbitrary titles, HTML, tokens or credentials are exported.
Logs never authorize automation or credit. Journal write failure does not affect
the required state stores, completion evaluator or Stop.

Lifecycle stages include completion-observed/validated, target-selected/rejected,
permit-issued/renewed/consumed/rejected, queued/queue-rejected, cooldown-started/
expired, native-activation/returned, destination-active/content, acknowledged,
cancelled, failed and timeout. Automatic safety cancellation is distinguished from
explicit user Stop. Terminal reasons include native-activation-threw,
destination-mismatch, destination-unsafe, catalog-mismatch, permit-expired and
navigation-unacknowledged. A rejected target is not a failed post-click route.

## Executed evidence

All 125 baseline tests retained unchanged; 12 new cases in navigation-status.test.js:

| Case | Observed result |
| --- | --- |
| Real modules + generated script, 1.3.2 → optional 1.4 → same-chapter 1.5 | One native call, independent content acknowledgement, assessment stays unfinished; credited 1.5 continues to the next learning entry; old video never replays |
| Current isolated optional assessment → same-chapter learning | Prior learning credit validates permission; assessment stays unfinished and no current-assessment completion-validation event is invented |
| Consecutive exact optional nodes / cross-chapter | Eligible learning selected; nine-node optional chain, unknown exam name, mandatory exam, restricted target, verification or unknown task blocks |
| Content at 2600ms + rebuilt catalog | Acknowledged through shared bounded observation |
| No change / content-only / too late / wrong course / duplicate catalog / throwing call | Distinct failure stage/code, no acknowledgement or false success |
| Actual delay, repeated view reads, Stop before/after click | Deadline decreases, never resets; cancelled callbacks do not act |
| Queue rejection / expired permit / denied target | No extra queued or activation event |
| v1 migration + 105 v2 writes + hostile detail fields | Unknown historical provenance retained; 100-event limit; private fields absent; clear persists |
| Missing/contradictory credit | Observed marker is not independently accepted credit or a permit |
| Unique pre-click catalog rebind / ambiguous replacement | Unique route succeeds once; ambiguous route cancels |
| Video start / recovery / periodic rest UI | Real deadlines and attempts visible; no timer when absent; no repeated live announcement/playback |

`npm test`: 137 PASS / 0 FAIL. Syntax: 49 files; production imports: 30.
No production dependencies. Build/exact artifact verification pass.
Native Chromium also validates real generated-media policy/end, HTML geometry,
trusted tab input, full runtime fields/layout at 1280×900 and 320×480, native-control
and quick-control pointer hits, same-chapter handoff with 700ms content loading,
decreasing real countdown and a trusted quick Stop. Synthetic routes/mocked course
media are not authenticated Chaoxing evidence. The reader geometry smoke fixes its
draw/interval to avoid near-bottom timing/rounding variance, retaining exact-bottom
assertion; production reader code is unchanged.

Remaining limits: actual native handlers and network loading beyond the 3s budget,
real page/control overlap, manager execution, background OS behavior, trusted live
transport/child binding and proprietary reader support need their own evidence.
No private HTML, companion installation, grant change, release or reference edit.
