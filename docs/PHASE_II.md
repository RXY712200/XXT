# Phase II candidate — Steps 03 and 04

Phase I is accepted at `dc3232040fa4df30ae58eeb08ebc102f2b06942e`.
Phase II awaits independent ChatGPT review. Step 03 passed 13 tests and import
checks before Step 04 integration. Final evidence is 32 independent synthetic
cases, not authenticated Chaoxing or Tampermonkey acceptance. Phase III is not
started; no real effects, adapters, browser bootstrap or installable exists.

## Read-only inventory and evidence

`createInventoryReader().scan(document)` returns an immutable envelope: revision,
observation time, verified course/active lesson/catalog/chapter identities,
ordered tasks, document scope, status and hazards. Titles classify content;
identities require unique catalog/owner metadata, never title/index/random IDs.
All tasks retain separate recognition, capability, execution eligibility and
platform credit. `executable` is false until a future adapter verifies capability.

Only a unique owned course card is traversed, including required nested frames.
Unrelated outer frames are excluded. Unknown attachment boundaries remain tasks;
ordinary forms/controls and inactive known previews do not become tasks. Required
unreadable scope, competing media, invalid metadata or ambiguity are unsafe;
absent/loading players remain loading. Document/live structures have no executor.

`inspectInventory(snapshot)` accepts only reader-branded snapshots and rereads
DOM. Owner/node/frame/source, catalog identity/title/order, active lesson, URL or
scope changes invalidate the snapshot. Credit changes are reread independently.
Explicit rescan/rebind is required; no polling or DOM watchers are installed.
Evidence includes subject/scope/provenance/status/reason; its envelope supplies
observation time and revision. Only owned lesson completed markers and uniquely
scoped attachment-wrapper markers supply positive credit. Zero aggregate counts,
other-owner markers, local results and contradictions cannot supply completion.
Marker/selector coverage is limited and requires real-platform validation.

## State, ownership and extension interfaces

`acquireSession(document, options)` returns one session/coordinator per document,
until disposal. It neither scans nor starts implicitly. `bind(snapshot)` replaces
the generation; `startNext()` selects one eligible task. Stop cancels immediately
and survives in-session rebind. Explicit Resume revalidates and rebuilds records;
destroy is final. Persistent Stop/reload recovery belongs to Phase V.

| From | Normal next state | Meaning |
| --- | --- | --- |
| DISCOVERED | PENDING | Retained, not executing. |
| PENDING | READY / UNSUPPORTED | Adapter selected or cannot execute. |
| READY | STARTING | Scheduled invocation revalidated. |
| STARTING | RUNNING / FAILED | Start promise fulfilled / rejected. |
| RUNNING | LOCAL_COMPLETED / FAILED | Current scoped result accepted once. |
| LOCAL_COMPLETED | WAITING_PLATFORM | Local end supplies no credit. |
| FAILED | UNRESOLVED | Failure remains visible. |
| PAUSED | PENDING | Contract permits reset; Resume rebuilds fresh records. |

Every non-paused/non-cancelled state may become PAUSED/CANCELLED on lifecycle
invalidation. Histories are inspectable; platform credit is a separate field.
Late start handles are cancelled; early end during STARTING and stale/duplicate
callbacks are rejected. No previous local evidence is restored after reload.

The explicit kind-to-adapter map accepts `{recognize(task), start(context)}`.
Context provides task/generation/AbortSignal, `done()`, `fail(reason)` and scoped
`schedule({key,delay,execute})`, but no catalog authority. Start may return a
promise/cancellation handle. Tests provide fake adapters only. Future adapters
must implement 1.0x, genuine media events and background recovery at their gates.

Default order stops on failure or unsupported boundaries. Own-credited known
tasks are retained without replay. Locally ended known tasks may yield to the
next owned known task without inventing credit. Explicit
`continueKnownAfterFailure: true` permits a verified following known task in the
same unchanged inventory; failure stays UNRESOLVED and blocks lesson departure.
Unknown/inaccessible/reordered tasks cannot be crossed. Default is false.

## Scheduling and navigation

One scheduler owns logical action keys/deadlines. `delayFor(category,task)` and
scoped commands supply nonnegative integer-ms delays; there are no random/rest
presets or settings yet. Logical keys are single-use within scheduler lifetime;
generations scope new keys. Stop/context/disposal cancel; even cancelled callbacks
invoked late must revalidate. No adapter-owned independent timer queue exists.
Action history is session memory, not durable completion or pacing authority.

`evaluateCompletion(snapshot)` rereads scoped evidence. Navigation modes are:

- `completed`: positive whole-lesson credit, every known task locally ended or
  own-credited, no failed/unresolved/unsupported execution or active media.
- `prior-credit`: positive whole-lesson credit avoids replay with known task
  scope, no contradictory/incomplete task evidence or unresolved execution. This
  does not mark each task locally complete or infer credit from counts.
- `assessment`: isolated paired optional chapter test, preceding chapter learning
  positively credited, unique immediate next-chapter learning target. The test
  remains unfinished and no answers/submission occur.

All modes validate exact course/lesson/catalog/ownership and reject verification,
restricted/ambiguous targets and unreadable required frames. Permits are private
branded, single-use, expire after 5000ms and bind evidence/revision/generation/
source/target. `queueNavigation(permit, fakePort, options)` revalidates immediately
before `port.activate(authorization,{signal})`; it contains no native click.
A new reader-branded target snapshot must acknowledge the exact course/target.
Wrong acknowledgements pause; default 3000ms timeout stops; stale acknowledgements
cannot bind. There is no automatic retry or native browser port.

## Checks and limitations

- `tests/platform.test.js`: 13 hierarchy/loading/order/identity/credit/hazard cases.
- `tests/core.test.js`: 19 state/ordering/failure/Stop/stale-event/permit/action/ack
  and single-session cases; tests drive actual new platform/core modules.
- `npm run check`: syntax/imports plus a static no-real-action scope guard. This
  is a development check, not a general security proof or build command.
- `npm ls --omit=dev`: empty. jsdom 26.1.0 is dev-only and locked; installation
  reports the transitive whatwg-encoding deprecation, not an install failure.

Fixtures are independently constructed inert DOM with actual attributes and
accessible frame documents; no scripts/resources are enabled. Null frame access
simulates unreadability, not actual browser cross-origin enforcement. No private
snapshots or reference code/tests are imported. Real media events, browser
permissions, platform marker coverage, dynamic authenticated layouts and native
navigation acknowledgements remain unverified. Later features remain obligations.
