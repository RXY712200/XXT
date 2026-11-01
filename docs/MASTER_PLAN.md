# Master plan — Phase I / Step 02

## Scope and acceptance

This plan has exactly five phases and ten implementation steps. Only Steps 01
and 02 are currently authorized. Their deliverables are documents and empty
directories. Everything described below as a runtime interface, state, test or
artifact is a design obligation for a later accepted step, not existing code.

The [feature matrix](FEATURE_MATRIX.md) is the capability baseline. The user owns
product requirements and final authorization; ChatGPT owns architecture, scope
and acceptance. Codex executes an approved step and reports evidence. Completing
a deliverable does not give Codex authority to start the next phase.

XXT is an independent new implementation. The referenced projects explain
observable needs and failure scenarios only. No old implementation, tests,
fixtures, documentation, generated artifact or Git ancestry is imported.
No legally verified clean-room claim is made. License/distribution decisions
remain for the owner before release; no license is inferred from the references.

## Components and dependency direction

Use plain JavaScript modules and small explicit data contracts. No dynamic plugin
loader, abstract factory tree, dependency-injection framework or arbitrary remote
code execution is needed. A simple local kind-to-adapter table will suffice.
No package manifest, runtime dependency or bundler is installed in Phase I.

| Directory | Responsibility | Allowed boundary |
| --- | --- | --- |
| `src/platform/` | Read supported page structure, catalog, owned frames, task metadata and observable platform evidence. | Produces snapshots and target candidates; does not start media, mutate credit or navigate. |
| `src/core/` | Own identity validation, task state, execution order, the scheduler, recovery budgets, completion evaluation and navigation permits. | Consumes inventory/evidence, selects one eligible action and invalidates obsolete work. |
| `src/adapters/` | Recognize and execute a supported kind through a narrow task context; report local results. | Never select another lesson, write platform credit or directly activate catalog navigation. |
| `src/runtime/` | Assemble one page lifecycle; expose reviewed browser/media/navigation/storage/message effects. | Performs only validated scheduled commands and reports observed outcomes. Handles boot, teardown and future console/manager entry. |
| `src/ui/` | Chinese settings, notifications, user intents and sanitized diagnostic presentation. | Requests Stop/Resume/rescan/settings changes; does not bypass core eligibility or invoke media/catalog effects directly. |
| `scripts/` | Future development/build/verification commands. | Generate from approved canonical sources; no copied legacy builder and no artifact during Phase I. |
| `tests/` | Independently written pure-logic tests and small synthetic-browser regressions. | No imported test suite, private page captures or claims of live acceptance from mocks. |
| `docs/` | Requirements, architecture, evidence and concise authoritative handoff. | Separate intended behavior, implementation status, test evidence and human acceptance. |

The runtime wires the components; core does not import UI rendering or individual
player implementations. Platform readers and adapters do not own a second queue.
The UI sends intents into core. Core gives scheduled, scoped commands to runtime
ports; adapters report events into core through their supplied task context.

## Data and interfaces

These are language-neutral interface definitions, not executable stubs.

| Contract | Required inputs and outputs | Constraints |
| --- | --- | --- |
| Inventory reader | `scan(pageScope)` returns a lesson reference, catalog snapshot, ordered task list, revision and hazards. | Every required owner is accounted for, including unknown/non-executable items. Missing/ambiguous identity is an explicit result. |
| Lesson reference | Course key, lesson key, catalog location and ownership evidence. | A title or DOM node pointer alone is not unique identity. Reconstructed DOM requires fresh verification. |
| Task reference | Stable content key, lesson key, owner key, kind, ordinal, execution capability and evidence. | A random session ID is an execution identity, never persistent content identity. Ordinal is scoped to a verified inventory, not globally unique by itself. |
| Evidence record | Evidence kind, scope/content key, provenance, observation time, inventory revision and reason. | Recognition, ownership, local execution and platform credit are distinct types. Do not serialize raw elements, private HTML or authenticated URLs in exports. |
| Adapter descriptor | Kind, `recognize(scopedTask)`, `start(taskContext)` and cancellation/disposal handle. | Returns unsupported when actual player/viewer evidence is insufficient. Results identify the exact task and generation. |
| Task context | Task reference, current generation, cancellation signal, scheduler access and permitted effect ports. | No catalog interface, arbitrary next-task callback or independent untracked timer loop. |
| Scheduler | `request(action)`, `cancel(scope)` and an inspectable deadline/status snapshot. | One owner of starts, deadlines, cancellation, delay precedence, rest and bounded recovery; no duplicated logical action. |
| Completion evaluator | Evaluate local results and independently read platform evidence against a fresh inventory. | Returns explicit eligibility/denial reasons. Failed/unknown/local-finished is not credited. |
| Navigation permit | Exact source lesson, target identity, evidence reference, revision, generation and validity window. | Runtime must revalidate before native activation, then observe the new context. A permit is not reusable completion proof. |
| Runtime effect ports | Narrow media, native-entry, catalog-activation, local-storage and optional cross-window transport operations. | No guessed destinations, arbitrary page-script evaluation or server progress/attendance writes. |
| Settings/diagnostics | Validated namespaced preferences, bounded allowlisted events and user intents. | Preferences and journals are not completion authority; account/session data is excluded. |

Execution status can distinguish pending, starting, running, locally finished,
failed/unresolved and unsupported. Platform-credit status separately distinguishes
unknown, positively credited and contradictory evidence. Do not use one status
field for both. A recognition-only task remains in the inventory with execution
disabled. A journal can explain decisions but cannot resurrect local completion
after reload or authorize catalog movement.

## Coordination and safety

Core has one execution coordinator. It may move among idle, scanning, ready,
starting, running, verifying, cooldown/rest, waiting for an external session,
unresolved, paused and stopped conditions. Concrete transition names and tables
are Step 04 deliverables; this is not permission to implement them now.

Before starting or continuing a task, validate course/lesson identity, owner,
inventory order/revision, feature settings, generation and safety hazards.
Context replacement, Stop or destruction cancels pending callbacks. A late
promise, event, deadline or child message cannot affect the replacement task.
Only one task executes at a time. A verified external live child is the same
active task under an explicit lease while its course parent waits, not a second
independent course executor.

Normal playback is exactly 1.0x. Background, blur, pause and stall monitoring are
first-class core/adapter contracts from the start. Their recovery commands and
security/Stop checks are immediate, not randomized content transitions. Never
interrupt already healthy playback to insert a delay or simulate user presence.
Browser restrictions must be reported honestly; autoplay and background behavior
cannot be guaranteed by a test double or a detection-avoidance claim.

For suitable content transitions, the scheduler samples one integer-millisecond
delay per logical action, with specific-category precedence. Recovery monitoring
and completion recognition do not acquire artificial delays. Rest/pacing uses
stable content identities and verified completion reasons, not play attempts,
random session IDs, failed tasks or journal entries. Exact ranges, quotas and
recovery budgets need acceptance at the relevant step; they are not inherited
implicitly from the old fork.

Core alone evaluates whether an independently executable following item in the
same lesson may run while another item remains unresolved. Unknown and failed
items are never erased, credited or silently treated as finished. The default
is to deny an uncertain route. Any scoped continuation/deferral rule must state
its ownership, ordering, cancellation and persistence requirements in Step 04
and be accepted before adapters use it. It never creates permission to leave an
unfinished lesson. Independent valid whole-lesson platform credit and a safe
assessment handoff remain distinct, narrowly validated routes.

Chapter tests are never answered or submitted. Only an evidenced optional
chapter-test handoff may leave the assessment unfinished and target a uniquely
identified eligible learning item. Authentication, CAPTCHA and mandatory
verification always block that handoff. Timers, absence of content and elapsed
watch time are not completion evidence.

Live/replay design must support long sessions without a one-hour completion
timeout. Actual finite playback near-end may be a local observation only;
unknown/infinite duration has no invented denominator. Separate child lifecycle,
window ownership and platform credit. Origin/source/correlation checks alone do
not authenticate same-page JavaScript. Unproven terminal-message provenance or
closure leaves the route fail-closed. Close only an associated owned handle when
policy permits; native opening without an observable handle remains unverified.
Manager grants, transport and trusted origins require real evidence and explicit
review in Step 08; no domains or privileged contexts are invented here.

## Phase I

### 01 Feature baseline

- Deliverables: FEATURE_MATRIX covering the 34 requested groups and three legacy
  differences; immutable reference identifiers and evidence categories.
- Dependencies: user scope and read-only inspection of the named references.
- Acceptance: all 37 rows include origin, behavior, priority, reference status,
  XXT NOT STARTED, a future scenario and restrictions; authenticated statements
  are scoped user reports, not invented or generalized PASS.
- Protected invariants: no implementation/history import; no private snapshots
  or reference-repository mutation; failed tasks do not imply completion.
- Explicit exclusions: execution code, new adapter categories, browser actions,
  AI answering, performance/release promises and inherited test acceptance.

### 02 Architecture and repository foundation

- Deliverables: this fixed plan, module/interface boundaries, AGENTS, HANDOFF,
  concise README, privacy ignore rules and the minimal directory placeholders.
- Dependencies: Step 01 coverage and verified empty independent XXT/main.
- Acceptance: five phases/ten steps; each step has all five planning fields;
  interfaces enforce one coordinator/scheduler and separate completion evidence;
  handoff is under 200 lines; initial commit has no reference ancestors or code.
- Protected invariants: `D:\XXT` is canonical, reference repos read-only, no
  Phase II action without acceptance and authorization.
- Explicit exclusions: package/dependency setup, runtime scaffolding, test code,
  build scripts, installables, CI workflows, tags, releases and deployment.

## Phase II

### 03 Platform and task inventory

- Deliverables: independent read-only page/catalog/owner recognition, immutable
  ordered inventory, stable identity/evidence contracts and small synthetic cases.
- Dependencies: accepted Phase I baseline; explicit user authorization; approved
  JavaScript/test toolchain and only sanitized, permitted structural evidence.
- Acceptance: ordinary, delayed, nested and ambiguous layouts produce complete
  ordered snapshots or explicit uncertainty; ownership/replacement invalidates
  old snapshots; known auxiliary UI is not automatically a required task.
- Protected invariants: no execution from recognition; every unknown stays in
  inventory; selectors need evidence, never account-specific hardcoding.
- Explicit exclusions: playback, scrolling, opening windows, catalog clicks,
  platform credit mutation and new permission/grant decisions.

### 04 State machine, scheduler, completion and navigation

- Deliverables: transition table, cancellable single scheduler, eligibility and
  completion gates, navigation-permit protocol and any explicitly accepted
  same-lesson deferral/failure rules, with independent regression cases.
- Dependencies: Step 03 inventory/identity acceptance; reviewed completion and
  optional-assessment evidence; approved retry/delay/cancellation policy.
- Acceptance: duplicates, stale generations, contradictory credit, Stop/reload,
  failed tasks and ambiguous targets cannot navigate; action precedence prevents
  stacked delays; a permitted transition requires revalidation/acknowledgement.
- Protected invariants: adapters cannot navigate; local execution is not platform
  credit; no unsupported task is silently skipped or counted complete.
- Explicit exclusions: actual media/readers/live execution and UI expansion;
  no forced advance, synthetic completion or speculative platform endpoints.

## Phase III

### 05 Video and background playback

- Deliverables: independent native-video adapter, promise-aware start, fixed
  rate, natural-ended reporting, focus/pause/stall recovery and bounded fallback.
- Dependencies: Step 04 core and Step 03 verified media ownership; supported
  inner-player evidence and approved recovery budgets.
- Acceptance: one start, 1.0x, genuine end once, safe rejection/replacement;
  blur/pause/stall behavior tested from the first usable video path, followed by
  scoped authenticated user testing before claiming real compatibility.
- Protected invariants: no seeking/progress fabrication, healthy-playback delay,
  stale restart, duplicate controller or completion/navigation bypass.
- Explicit exclusions: audio, documents, replay handoff, browser-policy bypass
  and copied page-guard implementation.

### 06 Audio and unattended recovery

- Deliverables: independent native-audio adapter, separate switches, audible-first
  start, policy-specific muted fallback, one bounded readiness cycle and explicit
  exhausted/unresolved results integrated with accepted same-lesson eligibility.
- Dependencies: accepted Step 05 behavior and Step 04 failure/continuation policy;
  verified audio/preview ownership and browser permission evidence.
- Acceptance: rejected promises never mean playing; muted success remains 1.0x;
  exhausted audio contributes no credit/count; only verified eligible following
  tasks may run; Stop/replaced source/generation prevents retry.
- Protected invariants: no mandatory-click loop as normal recovery; no automatic
  unmute after successful muted start; video and credit gates remain intact.
- Explicit exclusions: answering, fake interaction, permission flags/bypasses,
  generic force skipping and modifying core eligibility from inside the adapter.

## Phase IV

### 07 Document and mixed-task adapters

- Deliverables: supported viewer recognition, incremental actual-bottom reading,
  mixed inventory execution through the existing scheduler and unresolved-item
  preservation, with independently authored viewer/ownership cases.
- Dependencies: accepted Steps 03-06; actual supported viewer structure; accepted
  local-reading versus platform-credit rules and mixed-task ordering.
- Acceptance: variable steps/intervals reach a stable observed bottom without an
  instant jump; lost range/owner cancels; video/audio/document combinations retain
  order and cannot use local bottom alone to credit the lesson.
- Protected invariants: actual content geometry, no server credit writes, no
  second dispatcher, no regression to audio/video/background recovery.
- Explicit exclusions: invented PDF/book/knowledge-map selectors, completion
  endpoints, unsupported readers and automatic acceptance of private snapshots.

### 08 Live, assessment and extensibility adapters

- Deliverables: supported native live/replay entry handling, reviewed child
  lifecycle/transport, safe assessment handoff and recognition-only descriptors
  for evidenced non-executable kinds, registered in a simple local table.
- Dependencies: accepted Step 07 mixed-task boundaries, real entry/player/origin
  evidence, explicit window-ownership/provenance and manager-grant decisions.
- Acceptance: parent waits, long/unknown-duration sessions never time-complete,
  forged/stale terminal messages and early closure cannot advance; unowned tabs
  are not closed; assessments remain unanswered/unsubmitted; unsupported modules
  report their precise limitation.
- Protected invariants: no AI, fabricated attendance, guessed destinations or
  relaxed credit gates; no global architectural changes for another adapter.
- Explicit exclusions: unsupported media executors, arbitrary plugin loading,
  legacy runtime installation and cross-origin completion based on trust guesses.

## Phase V

### 09 Settings, pacing, recovery and diagnostics

- Deliverables: compact Chinese UI, independent validated switches/delay ranges,
  bounded rest and persistent pacing, Stop/Resume/rescan, terminal recovery and
  bounded privacy-conscious diagnostics, integrated with existing core hooks.
- Dependencies: accepted executable/unsupported boundaries from Steps 03-08;
  approved default ranges, quotas, storage schema/migrations and privacy rules.
- Acceptance: user changes cancel appropriate pending work; reload preserves
  deadlines and Stop without inventing progress; stable completed content counts
  once; invalid settings/storage failure are explicit; exports contain no secrets.
- Protected invariants: background recovery remains core rather than a new UI
  feature; settings, logs and pacing never become completion authority.
- Explicit exclusions: telemetry/external services, account data collection,
  journal-based task skipping and changes to accepted adapter behavior.

### 10 Integration, regression, packaging and release readiness

- Deliverables: bounded complete integration evidence, a reviewed canonical
  source/build/installable contract, independently written generation and exact
  source/metadata synchronization checks, and a candid readiness report.
- Dependencies: acceptance of Steps 01-09, documented unresolved limitations,
  approved licensing/grants/entry policy and authenticated test opportunities.
- Acceptance: named regression gates pass or failures remain explicitly blocking;
  generated payload matches sources/metadata; only the intended installable is
  identified for later manual upload; synthetic and authenticated results differ.
- Protected invariants: generated files are never hand edited, release readiness
  is not user authorization to publish, and reference repositories remain intact.
- Explicit exclusions: automatic merge/release/tag/deployment/website upload,
  production-tested claims without evidence, and scope beyond this ten-step plan.

## Phase II entry conditions and open decisions

Do not execute these conditions as Phase I work:

- ChatGPT accepts FEATURE_MATRIX and this architecture, including priority and
  uncertainty treatment; the user explicitly authorizes Step 03 execution.
- Record the actual accepted XXT commit/ref in HANDOFF after that decision. A
  pushed candidate is not automatically a last accepted baseline.
- Recheck `RXY712200/XXT`, `D:\XXT`, `main`, clean status and the accepted HEAD.
- Accept the Step 03 JavaScript module/test toolchain and permitted synthetic
  structural inputs. No private reference fixtures may be copied by default.
- Keep Step 03 read-only recognition; Steps 04-10 are not automatically authorized.
- Later unresolved choices include exact policy defaults, credit-marker coverage,
  safe deferral, actual document/live evidence, transport/grants and installable
  path/tooling. Decide them at their dependency gates instead of guessing now.

Phase I validation checks documents, links, structure, privacy and Git ancestry.
It cannot test playback, browser permissions, platform compatibility or packaging
because there is no XXT implementation yet.
