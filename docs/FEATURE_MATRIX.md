> CURRENT OWNER DECISION after ae9a792: this matrix is historical evidence for the
> retired rewrite, not a production runtime contract. The complete original fork
> 351c08dc is canonical. Redistribution permission was not established, so XXT
> bundles no engine; see CANONICAL_RUNTIME_RESTORE.md. No row below implies that
> rewritten behavior, diagnostic schema or UI is imposed on the original V3.

# Feature matrix — Phase I baseline / Phase V status

This is a requirements inventory, not an implementation or acceptance report.
There are **37 entries: 34 capability groups and 3 explicit legacy differences**.
Phases I–III are accepted for scoped implementation. Phase IV is pending review;
authenticated Chaoxing compatibility remains unaccepted.
**PARTIAL** below means only the named foundation has synthetic evidence, not
that the complete observable capability is implemented or accepted. Excluded
entries are policy boundaries, not promises to implement the excluded behavior.

## References and evidence

- **U**: upstream V3 at
  [9a23b357875a72ed9bfd9e652257b0849a6855d7](https://github.com/chaolucky18/xuexitongScript/tree/9a23b357875a72ed9bfd9e652257b0849a6855d7),
  observed as upstream HEAD during this inventory. Its V3 source, README and
  separate answering experiment were inspected read-only.
- **F**: developed fork, review branch, pinned to
  [351c08dc4d772908c3d098e8c9160be434bf1064](https://github.com/RXY712200/xuexitongScript/tree/351c08dc4d772908c3d098e8c9160be434bf1064).
  Relevant entry points are the production source, focused tests and review
  history at that commit. This is a functional reference, not an XXT ancestor.
- **I**: implementation/source-inspection evidence only.
- **S**: synthetic evidence reported by the reference delivery. Its last audio
  delivery reported 27 new focused cases and 16 selected playback/completion
  cases, plus VM/pacing/GM checks. These were not rerun as XXT tests. Its previous
  complete-suite backlog had 46 failures and was not fully rerun after that audio
  change. No blanket reference-suite PASS is inferred.
- **R**: historical user-reported authenticated observation in the supplied task
  history. It is course/scenario-specific, not independently reproduced here,
  and does not authenticate every feature at the pinned commit.
- **N**: new XXT requirement; later executable adapters remain unimplemented.

Historical R observations include ordinary video at 1.0x with background playback
and platform credit; detection of dozens of catalog nodes; native recorded-replay
opening by the platform handler; manual audible recovery after an autoplay denial;
and document/knowledge-map reading reported working in specific lessons. Other
authenticated reports describe startup, classification and navigation failures.
These observations must not be converted into universal compatibility claims.

P0 means a safety/core requirement. P1 is a planned capability after core gates.
Experimental means recognition or browser-sensitive behavior whose executable
support requires additional evidence and acceptance. Acceptance scenarios
below describe complete capability targets. Phase II foundation evidence is
limited to the scoped cases in [PHASE_II.md](PHASE_II.md).

| ID / capability | Origin | Expected observable XXT behavior | Priority | Current reference status / evidence | XXT implementation | Acceptance scenario | Known restrictions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| XXT-F01 Automatic startup/readiness | upstream; developed fork | Start once on a recognized course page; wait boundedly for the owned content and catalog to become ready. | P0 | U has automatic bootstrap; F adds delayed-frame/context handling (I/S); historical R startup failures occurred. | PARTIAL: controlled bootstrap and bounded initial readiness; synthetic/native stopped entry. | Enter and refresh a supported lesson with delayed frames: one coordinator, one eventual start, safe timeout. | A loaded outer page is not proof of ready inner media; no unbounded run loop. |
| XXT-F02 Chapter/lesson catalog | upstream; developed fork | Read dynamic nested chapters and leaf lessons without a fixed count. | P0 | U traverses chapters; F handles mixed-depth catalogs (I/S); R reported 54 and larger node inventories, not full traversal acceptance. | PARTIAL: dynamic hierarchy/active leaf recognition; synthetic nested catalog. | Rescan a large mixed-depth directory and identify the unique active leaf and its chapter. | Groups are not executable leaves; ambiguous topology stops selection. |
| XXT-F03 Lesson/task ownership | developed fork | Bind execution to a unique course, lesson, inventory item and owned frame chain. | P0 | F has identity, snapshot and scope checks (I/S); complex authenticated layouts prompted repairs. | PARTIAL: branded ordered ownership snapshots, revisions and generation checks. | Replace an owner or change lesson during a pending action: old action cannot run. | Unreadable required scope or indistinguishable ownership is not executable. |
| XXT-F04 Learning-objective/media tab | upstream; developed fork | Select an evidenced media tab from an objective page, once and through its native mechanism. | P1 | U/F contain objective-to-video handling (I/S). | PARTIAL: explicit objective/video labels, one native activation and bounded content acknowledgement; live validation pending. | An objective page with one eligible media tab changes task and is freshly recognized. | Do not substitute a next-lesson button or guess tab meaning from a number alone. |
| XXT-F05 Manual tab/sidebar detection | upstream; developed fork | Cancel obsolete work and rescan after a genuine user context change. | P0 | U recognizes video-tab reentry; F adds sidebar/catalog lifecycle guards (I/S); historical R DOM replacement failures remain relevant. | PARTIAL: trusted tab acknowledgement and bounded same-lesson loading reconstruction, with fresh content/source/owner validation. | Old media is cancelled; only equivalent independently verified replacement may start. | No inferred identity from an auxiliary load; changed or ambiguous tasks stay manual. |
| XXT-F06 Video playback | upstream; developed fork | Start one eligible primary video using actual play success and honor the playback switch. | P0 | U/F implement playback; R ordinary playback worked in particular lessons; S covers ownership/start races. | PARTIAL: owned native video with source-present readyState=0 startup; synthetic/native smoke only. | Supported single video starts once; a rejected play promise is never reported as running. | Browser autoplay policy and unsupported players may prevent playback. |
| XXT-F07 Fixed normal speed | developed fork; new requirement | Keep video, audio and supported replay at exactly 1.0x. | P0 | F enforces normal speed (I/S); R ordinary video at 1.0x reported working. | PARTIAL: fixed 1.0x on start/rate changes/recovery; synthetic and native element checks. | Try settings/rate changes and recovery: every managed player remains 1.0x. | No speed-up control, seeking ahead or synthetic progress. |
| XXT-F08 Background/focus protection | upstream; developed fork | Preserve legitimate playback across blur, visibility and mouse-leave events without faking user presence. | P0 | U has page guards; F preserves them (I/S); R confirms specific background-video use. | PARTIAL: owned page/frame focus, visibility and pause guards; synthetic events, no real OS/tab-switch acceptance. | Move focus away during an owned video; playback continues or recovers without starting a duplicate. | Browser throttling/permission cannot be guaranteed away; Stop and user settings take precedence. |
| XXT-F09 Pause/stall recovery | upstream; developed fork | Detect actual pause/stall and recover the current owned task within bounded cooldowns. | P0 | U/F monitor interruptions and progression (I/S). | PARTIAL: three recovery attempts, 3000ms cooldown and 8000ms no-progress detection; simulated time. | Pause unexpectedly, then simulate no progression: recovery stays tied to the same media and avoids loops. | Deliberate Stop, ended media and changed ownership must not be restarted. |
| XXT-F10 Retry/muted video fallback | upstream; developed fork | Bound retries and permit muted retry where browser policy allows. | P0 | U/F implement retry and muted fallback (I/S). | PARTIAL: one automatic muted fallback after policy denial; native audio denial remains safely unresolved. | Audible video rejection followed by allowed muted playback produces one bounded recovery sequence. | Rejection is not success; no browser flags or permission bypass. |
| XXT-F11 Natural ended/deduplication | upstream; developed fork | Accept a genuine ended observation for the current task once; keep it separate from platform credit. | P0 | U has ended handling/navigation locks; F adds per-player and stale-context protection (I/S). | PARTIAL: natural-ended property and fulfilled-start handshake; duplicate and stale result guards. | Ended plus duplicate monitor/event callbacks create one local result, not two transitions. | Local ended does not prove credited completion of the lesson. |
| XXT-F12 Audio recognition/settings | developed fork | Recognize owned native audio, keep separate audio playback and next-audio controls. | P0 | F recognizes native audio and separates controls (I/S); R identified a valid audio player but experienced policy denial. | PARTIAL: independent native audio adapter and enable control; no settings UI. | Audio-only and mixed lessons select the correct primary audio; disabled audio does not start. | Preview audio is not automatically a learning task; competing active players stop execution. |
| XXT-F13 Audible then muted audio | developed fork | Try audible first; one automatic muted attempt after NotAllowedError; mark running only on success. | P0 | F implements bounded fallback (I/S); R manual audible play succeeded after earlier automatic denial; latest automatic fix lacks R acceptance. | PARTIAL: audible-first and one muted retry implemented; simulated success, real Chrome dual-denial observed. | Audible denial then muted success yields exactly two attempts, normal speed and no automatic later unmute. | Do not require a click just to try fallback; no assumed browser permission. |
| XXT-F14 Audio loading/exhaustion | developed fork | Allow one bounded readiness cycle; keep exhausted audio unresolved; continue only a verified eligible following item in the same lesson. | P0 | F has a five-second error-recovery window and failure-specific selection (I/S); no authenticated acceptance of latest fix. | PARTIAL: 5000ms missing-source wait, source-present native startup and one AbortError retry; failure policy unchanged. | Timeout or dual denial does not count completion; owned following media may run, unknown/reordered scope stops. | No new-lesson advancement from failure; partial-session exceptions need an accepted policy, not copied logic. |
| XXT-F15 Ordered attachments | developed fork | Preserve inventory order and execute independently owned unfinished attachments sequentially. | P0 | F discovers native multi-attachments (I/S); historical pending-PDF/status bugs required correction. | PARTIAL: ordered inventory and fake sequential execution; no real adapters. | Several videos and a trailing PDF retain their identities/order; no duplicate starts or dropped tail item. | Playback order is not inferred from unfinished-count totals. |
| XXT-F16 Mixed video/audio/document | developed fork | Coordinate known media and supported readers in one lesson through the same scheduler. | P0 | F has a mixed dispatcher and scoped partial behavior (I/S); not universal authenticated coverage. | PARTIAL: ordered known execution, atomic explicit deferral and durable RESTORED_WAITING_PLATFORM records. | Local-ended restoration is visible, preserves ordinals and never invents new playback or platform credit. | Unknown remains unresolved; busy/stale/write-failed deferral grants nothing. |
| XXT-F17 Attachment credit | developed fork | Associate observable platform markers with exactly one owner; execution state stays separate. | P0 | F has owner-scoped credit sampling and separate pending/credit fields (I/S); marker support is not uniform across media. | PARTIAL: fresh scoped attachment-marker evaluator; platform coverage unverified. | A sibling icon or local pending/ended value cannot credit another attachment. | No generic CSS icon or absent attachment is independent completion proof. |
| XXT-F18 Whole-lesson credit | developed fork; new requirement | Require independent current platform-completion evidence before credited lesson advancement. | P0 | F has prior-credit and post-ended validation (I/S); R ordinary video credit was observed, but navigation backlog is not fully resolved. | PARTIAL: fresh independently evaluated lesson credit selects the unchanged prior-credit gate equally for fresh/restored entry; local history supplies no credit. | Valid lesson-only proof can advance once without replay; incomplete/contradictory/unknown/verification/active-media evidence still blocks, and native destination must be acknowledged. | Never infer credit from time, logs, audio failure, local document bottom or tab closure. |
| XXT-F19 Safe navigation | upstream; developed fork | Revalidate one eligible next content/lesson/chapter target after any delay and observe actual context change. | P0 | U navigates; F adds completion/identity/delay guards (I/S); authenticated acceptance unresolved. | PARTIAL: branded permits, guarded target rebinding, native activation vs acknowledgement stages; shared bounded 100ms observation and existing 3000ms default deadline. | One activation; target becomes independently active and new owned content arrives; stale/locked/ambiguous targets never succeed. | Click return is not acknowledgement; no timeout extension or guessed URL. |
| XXT-F20 Already-completed lessons | developed fork | Avoid replay only when the current platform already positively credits the unique lesson. | P0 | F implements a prior-credit shortcut (I/S); actual authenticated transition still unverified. | PARTIAL: real-module/generated/native-synthetic credited-video handoff and continued credited destination without replay. | Positive source marker is independently validated before private navigation permission; contradictory/unrelated proof cannot advance. | No journal or stale local completion authorizes the shortcut. |
| XXT-F21 Assessments/deferral | upstream; developed fork | Recognize chapter tests; never answer/submit; hand off only through accepted eligibility to an unambiguous learning item. | P0 | User-added fork target traversal adapted at pinned 351c08dc; historical authenticated cause not established. | PARTIAL: at most eight exact optional chapter tests may remain unfinished while selecting verified same/cross-chapter learning; explicit catalog-number prefix supported. | 1.3.2 credited video skips 1.4 本章自测 to 1.5 learning once; current optional assessment can also hand off without any completion claim. | Unknown/mandatory/restricted/verification boundaries block; no assessment answer, submit or completion write. |
| XXT-F22 PDF/document reading | developed fork | Identify a supported owned viewer and scroll incrementally to its actual stable bottom; local reading is not server credit. | P1 | F contains PDF/positive-range and knowledge-map reading (I/S); R reports particular document/knowledge-map success; other reader cases still fail synthetically. | PARTIAL: unique accessible native HTML scroll geometry, incremental movement and stable local bottom; PDF plugins unsupported. | A positive-range reader scrolls gradually; changed range/owner cancels; no platform marker means no credited lesson advance. | Outer snapshots do not establish inner-viewer support; fitting/unknown viewers need evidence. |
| XXT-F23 Live/replay entry | developed fork | Recognize one owned native entry and preserve its platform opening mechanism. | P1 | F recognizes native/nested cards (I/S); R native replay opened manually; automated popup outcome not universally verified. | PARTIAL: native entry/status/destination observation; authentic user opening only, popup outcome unverified. | Correct entry is identified; duplicate or unrelated cards cannot open extra sessions. | No guessed replay URLs/domains; trusted user activation may be required by browser policy. |
| XXT-F24 Cross-window lifecycle | developed fork | Parent waits for its correlated child; validate liveness, terminal evidence, ownership and separate platform credit. | experimental | F has GM claim/ack and conservative bridge paths (I/S); mock/two-context evidence is not real manager acceptance. | PARTIAL: read-only replay/closure observations; no trusted transport or automatic return; manual continuation required. | A long session does not time out as completed; stale/forged messages and early closure cannot advance the parent. | No one-hour completion assumption; 99% near-end is not credit; no unowned close or assumed sender provenance. |
| XXT-F25 Recognition-only types | developed fork | Report book reader, timed reader, audio slides, hyperlink and legacy animation without inventing executors. | experimental | F recognizes five types but deliberately does not execute them (I/S). | PARTIAL: five evidenced structural recognizers integrated into unknown inventory; all remain non-executable. | Each supported structural match reports its specific unsupported/manual reason and cannot complete or navigate. | Recognition evidence is not playback, page-turn or completion evidence; no legacy runtime installation. |
| XXT-F26 Unknown/ambiguous tasks | developed fork; new requirement | Retain unresolved inventory entries and fail safely when ownership, type or required evidence is unclear. | P0 | F preserves unknowns and uses scoped deferral (I/S); preservation around known tasks is synthetic evidence. | PARTIAL: same-scope idle deferral persists/applies one exact decision; failed attempts leave storage and authority unchanged. | Unknown survives reload as unresolved; corrected-task explicit recheck retains only exact unchanged local identities. | Deferral never authorizes catalog navigation or completion. |
| XXT-F27 Feature switches | developed fork | Provide independent controls for playback, content/lesson/chapter transitions, readers, live and recovery-related behavior. | P1 | F has persisted feature switches (I/S). | IMPLEMENTED CANDIDATE: validated independent persisted switches. | Disabling a feature cancels its pending work without replaying a completed task or interrupting unrelated valid playback. | Fixed speed and completion authority are not bypass switches. |
| XXT-F28 Action delays | developed fork | Use independently sampled integer-ms category ranges under one cancellable scheduler, with no stacked logical-action delays. | P1 | F has short/legacy/custom ranges and canonical aliases (I/S). | IMPLEMENTED CANDIDATE: accepted settings/category defaults retained; bottom runtime reads actual action/context/rest deadlines with no extra random draw. | Visible countdown decreases under the existing watch cadence and disappears on Stop; absent deadline has no fabricated seconds. | Rendering never resets/schedules a delay; no detection-avoidance guarantee. |
| XXT-F29 Rest/persistent pacing | developed fork | Count uniquely completed content, enforce bounded rest and retain deadlines without replaying failed tasks. | P1 | F has persistent pacing/rest and content deduplication (I/S). | IMPLEMENTED CANDIDATE: optional configured rest and unique local processing keys; never credit authority. | Duplicate reports/session IDs do not double-count one content item; reload preserves one rest deadline. | Session identity is not content identity; failure, preview, unknown and mere opening never count. |
| XXT-F30 Stop/resume/rescan/recovery | upstream; developed fork | Stop immediately, invalidate callbacks, and allow explicit validated restart with a bounded recovery budget. | P0 | U has retries/run/destroy; F adds terminal recovery and pause persistence (I/S). | PARTIAL: unfinished same-lesson readiness waits consume persisted attempts; 10s deadline and third-attempt terminal/no reload. | Stop, unsafe content and stale callbacks cannot restart old media; terminal survives reinjection. | Missing identity is not a fresh budget; no automatic reload loop. |
| XXT-F31 Chinese UI | developed fork | Provide a compact collapsible settings/notification surface with validation and clear unresolved status. | P1 | Fork neutral two-area workflow retained; authenticated overlap still unverified. | IMPLEMENTED CANDIDATE: always-visible bottom phase/action/task/counts/credit/local/upcoming/countdown/recovery/rest/reason and quick Stop/Rescan; top holds collapsible settings/export. | Native 1280x900 and 320x480 field visibility, scrollbar-safe bounds, no panel overlap and native/quick control hit tests pass. | No fake overall percentages, account data or countdown live-announcement spam; rendering cannot replay media. |
| XXT-F32 Diagnostics/privacy | developed fork | Record bounded, allowlisted decisions and export sanitized diagnostics separate from completion authority. | P1 | Prior v1 counters cannot establish click/success; v2 lifecycle captures new evidence only. | IMPLEMENTED CANDIDATE: 100 v2 events with phase/stage/reason/outcome/order/relative time/kind/deadline category/retry; old v1 entries remain explicitly legacy/unknown. | Queue rejection differs from queued; actual native call/return differs from destination acknowledgement; timeout and mismatch have distinct codes. | No IDs, URLs, arbitrary titles, HTML or credentials; journal never authorizes credit or actions. |
| XXT-F33 Console/Tampermonkey entry | upstream; developed fork | Later provide controlled console entry and a reviewed installable sharing one runtime lifecycle. | P1 | U/F have console entry and generated installables (I/S); R users installed the fork with mixed functional outcomes. | PARTIAL: generated and console share owner; native Chrome tested, real manager unverified. | Console and manager entry cannot create two active coordinators on one page. | No package exists in Phase I; grants/context and child support need explicit review. |
| XXT-F34 Reproducible generation | upstream; developed fork | Generate a single canonical future installable from approved XXT sources/metadata and verify exact payload consistency. | P0 | U/F have a source-to-userscript build and synchronization checks (I/S). | IMPLEMENTED CANDIDATE: exact independent generation and artifact SHA-256 verification. | A source or metadata mismatch fails verification; generated artifact is never hand edited. | Future paths/toolchain decided before implementation; no copied build script or artifact now. |
| XXT-F35 Legacy rate configuration difference | upstream; new requirement | Exclude accelerated/configurable playback rate; XXT normal-speed policy takes precedence. | P0 | U defaults to configurable 1.5x; F enforces 1.0x (I). | NOT STARTED | Future settings cannot select >1.0x or disable the rate invariant. | This exclusion is intentional, not a missing upstream capability. |
| XXT-F36 Separate DeepSeek experiment | upstream; new requirement | Exclude answering APIs, local answering servers and automated question submission from XXT. | experimental | A separate upstream/fork answering experiment exists (I); no claim of authenticated efficacy. | NOT STARTED | Future dependency/runtime review finds no AI answering service or answer/submit path. | Excluded permanently under current scope; not a planned experimental XXT adapter. |
| XXT-F37 Legacy force advance | upstream; new requirement | Prohibit leaving unfinished/unknown content without accepted independent completion/assessment eligibility. | P0 | U contains optional no-video advance, disabled by default, and weaker stepping; F tightens eligibility (I). | NOT STARTED | Failed media, absent players and ambiguous credit cannot produce a next-lesson click. | No force-next switch, fabricated marker or timeout-as-completion shortcut. |

## Acceptance boundary

Phase I was accepted at `dc3232040fa4df30ae58eeb08ebc102f2b06942e`.
Phase II was accepted at `2428489a83d147542b6e318d0bcaeaa6b9766b01`.
Phase III adds native media adapters with synthetic and limited native-browser
evidence in PHASE_III.md; acceptance remains pending. No authenticated XXT tests,
real catalog navigation or packaging exist. NOT STARTED rows
remain future obligations or permanent exclusions. No reference PASS is inherited.

Phase III scoped acceptance: `64b67cb29ed95ee03946775f43c8b9bee29c9b76`.
Phase IV evidence and unsupported boundaries: [PHASE_IV.md](PHASE_IV.md).

## Phase V candidate evidence

Phase IV accepted at `3fc8021a7b51d0770fbf7931a0d2aa548213e3e1`.
Phase V is pending independent review. Current implementation/evidence for all
37 rows is classified in [RELEASE_READINESS.md](RELEASE_READINESS.md); historical
row descriptions above remain requirements, not authenticated acceptance.

F04/F05 targeted correction: initial/explicit objective activation share one
bounded operation; Rescan preserves Stop; current video title/text recognition
is consistent. Evidence is synthetic and controlled Chrome only.

F05 final identity repair: exact unique active, distinct numbered and ambiguous
generic/numbered outcomes; controlled native trusted mouse integration tested
on a synthetic page. Actual Chaoxing acceptance remains pending.

F31 two-area UI restored: persistent bottom-right notice and top-right learning
settings with grouped controls. Native computed layout/pointer checks at desktop
and 320px width passed; real course control overlap remains unverified.

Migration update: F18/F19/F20 receive positive-credit detached-node/removed-known
attachment continuity and directly reused user catalog-status logic. F19 fresh
settings navigation enabled by explicit user requirement; existing false retained.
Integrated follow-up (baseline 36aa62cf): F05/F18/F19/F20 now include bounded
positive-credit iframe reconstruction and generated-runtime no-replay/native-ack
coverage. F16/F26 gain durable exact-scope processing, explicit unknown deferral
and corrected-task recheck; unknowns stay unresolved and cannot authorize departure.
F22 gains a sampled 5000–7000ms measured trajectory with independent stable bottom.
F27/F28/F32 gain ten category overrides, no stacked rest/short delay, and persistent
allowlisted decisions; existing saved values/Stop are preserved. F30 gains extracted
three-attempt durable terminal recovery through the existing scheduler, without
automatic reload. F24 gains tested developer lifecycle state components; trusted
transport/child binding remain unwired and automatic return remains unsupported.
104 tests pass with all 92 baseline cases retained. Implementation dependencies
and separate authenticated gaps are listed in FORK_MIGRATION_AUDIT.md; no live
platform acceptance or stable release is claimed.
