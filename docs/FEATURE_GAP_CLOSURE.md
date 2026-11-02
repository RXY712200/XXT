# Pre-edit consolidated gap audit

Reviewed starting SHA: `5f91168074a8df13af850080178e45f43cb980a7`.
This report is written before production edits. No sixth phase is introduced.
Reference behavior: upstream `9a23b357875a72ed9bfd9e652257b0849a6855d7` and
fork `351c08dc4d772908c3d098e8c9160be434bf1064`, read-only Git objects.
Platform identifiers inform interoperability; implementation/tests are independent.

Classes: A implementable gap; B integration repair; C implemented/needs live
validation; D evidence-blocked; E intentionally excluded.

| Feature IDs | Class | Current implementation, gap and next acceptance |
| --- | --- | --- |
| F01–F03 | C | Bounded bootstrap/owned inventory; real page startup/large catalog check needed. |
| F04 | A | Objective-to-media tab missing; reference evidences prev_title/prev_white with explicit video labels. Implement one uniquely labeled native tab, no numeric inference. |
| F05 | B | Native same-lesson tab transition must invalidate old work and acknowledge new owned content; unknown replacements remain manual. |
| F06–F11 | C | Owned media, 1.0x, bounded background recovery/end; actual browser focus/credit coverage needed. |
| F12–F14 | C | Audio fallback/readiness and explicit failure continuation exist; native policy denial remains possible. |
| F15–F18 | C | Ordered inventory and independent credit gates exist; actual mixed markers need validation. |
| F19–F21 | C | Native permit/ack and assessment eligibility exist, navigation defaults OFF; real catalog handler test needed. |
| F22 | D/C | Native HTML geometry works; proprietary/plugin PDF and knowledge-map geometry need authentic inner-viewer evidence. |
| F23–F24 | D/C | Native entry/manual observation exists; trustworthy child ownership/transport and completion evidence missing. No guessed opening/return. |
| F25 | A/D | Replace disabled placeholder recognition where reference supplies explicit route/module/selector combinations; execution remains disabled without reader/credit evidence. |
| F26 | C | Unknown boundaries retained; verify genuine unknown between known tasks. |
| F27–F30 | C | Settings/delay/rest/Stop exist; verify persistence and real lifecycle. |
| F31 | B | UI currently reads lesson marker even if inventory invalid. Require fresh valid completion evaluation; never stale green credit. |
| F32–F34 | C | Sanitized diagnostics and reproducible sole artifact exist; native manager acceptance missing. |
| F35–F37 | E | Acceleration, answering APIs and forced unfinished advancement remain excluded. |

Remaining D items need sanitized owned inner DOM, frame origins/lineage, actual
native handlers and observed independent credit patterns. Native live return also
needs proven child provenance/ownership; ordinary page messages are not sufficient.
No private snapshots will be imported. Automated evidence never substitutes for
authenticated compatibility. Detailed implemented deltas/results follow below.

## Per-entry closure matrix

| ID | Class after correction | Missing evidence / next acceptance |
| --- | --- | --- |
| XXT-F01 | C | Enter and refresh a supported lesson with delayed frames: one coordinator, one eventual start, safe timeout. |
| XXT-F02 | C | Rescan a large mixed-depth directory and identify the unique active leaf and its chapter. |
| XXT-F03 | C | Replace an owner or change lesson during a pending action: old action cannot run. |
| XXT-F04 | A/B implemented; C validation pending | An objective page with one eligible media tab changes task and is freshly recognized. |
| XXT-F05 | A/B implemented; C validation pending | User switches a tab or lesson while an action is pending: only new owned content can start. |
| XXT-F06 | C | Supported single video starts once; a rejected play promise is never reported as running. |
| XXT-F07 | C | Try settings/rate changes and recovery: every managed player remains 1.0x. |
| XXT-F08 | C | Move focus away during an owned video; playback continues or recovers without starting a duplicate. |
| XXT-F09 | C | Pause unexpectedly, then simulate no progression: recovery stays tied to the same media and avoids loops. |
| XXT-F10 | C | Audible video rejection followed by allowed muted playback produces one bounded recovery sequence. |
| XXT-F11 | C | Ended plus duplicate monitor/event callbacks create one local result, not two transitions. |
| XXT-F12 | C | Audio-only and mixed lessons select the correct primary audio; disabled audio does not start. |
| XXT-F13 | C | Audible denial then muted success yields exactly two attempts, normal speed and no automatic later unmute. |
| XXT-F14 | C | Timeout or dual denial does not count completion; owned following media may run, unknown/reordered scope stops. |
| XXT-F15 | C | Several videos and a trailing PDF retain their identities/order; no duplicate starts or dropped tail item. |
| XXT-F16 | C | A mixed lesson runs known eligible items one at a time while unresolved items remain visible. |
| XXT-F17 | C | A sibling icon or local pending/ended value cannot credit another attachment. |
| XXT-F18 | C | Natural end without marker stays unresolved; a valid marker is rechecked against current identity before advancement. |
| XXT-F19 | C | Duplicate completion events lead to one native activation; stale, locked or ambiguous targets are not clicked. |
| XXT-F20 | C | A credited stable lesson is not replayed; contradictory or unrelated credit cannot skip an unfinished item. |
| XXT-F21 | C | Optional test stays unfinished; authentication/CAPTCHA or unclear next chapter blocks handoff. |
| XXT-F22 | D/partial | Owned inner viewer/player DOM, native lifecycle and independent credit evidence; no guessed executor. |
| XXT-F23 | D/partial | Owned inner viewer/player DOM, native lifecycle and independent credit evidence; no guessed executor. |
| XXT-F24 | D/partial | Owned inner viewer/player DOM, native lifecycle and independent credit evidence; no guessed executor. |
| XXT-F25 | D/partial | Owned inner viewer/player DOM, native lifecycle and independent credit evidence; no guessed executor. |
| XXT-F26 | C | Unknown content survives rescan/reload without invented completion; unsafe ownership stops actions. |
| XXT-F27 | C | Disabling a feature cancels its pending work without replaying a completed task or interrupting unrelated valid playback. |
| XXT-F28 | C | Bounds include both endpoints; Stop/context changes cancel; safety recovery remains immediate. |
| XXT-F29 | C | Duplicate reports/session IDs do not double-count one content item; reload preserves one rest deadline. |
| XXT-F30 | C | Reload/reinjection cannot bypass terminal Stop; a positively identified different lesson gets its own budget. |
| XXT-F31 | A/B implemented; C validation pending | Expand/collapse, edit invalid ranges, restore defaults and Stop without obscuring media controls. |
| XXT-F32 | C | Export omits credentials, raw HTML and authenticated identifiers; clearing history does not create completion or restart work. |
| XXT-F33 | C | Console and manager entry cannot create two active coordinators on one page. |
| XXT-F34 | C | A source or metadata mismatch fails verification; generated artifact is never hand edited. |
| XXT-F35 | E | Intentional exclusion; verify no accelerated rate, answering or forced advance. |
| XXT-F36 | E | Intentional exclusion; verify no accelerated rate, answering or forced advance. |
| XXT-F37 | E | Intentional exclusion; verify no accelerated rate, answering or forced advance. |

## Closed items and exact limits

F04: objective page plus exactly one visible explicitly labeled video tab, unique
course/lesson and no independent current tasks permits one native handler call.
A real content replacement and video label must be observed within 10s. Stop,
ambiguous/numeric tabs and hazards block. F05: trusted native video-tab selections
cancel prior work and use the same bounded acknowledgement; no generic tab guessing.
F31: UI credit now uses the fresh completion evaluator, not an invalid snapshot's
positive marker. Local result display also requires current valid inventory.

F25 recognition now uses pinned-reference route/module/DOM combinations for book,
timed reader, audio-slides, hyperlink and legacy animation. They remain unknown
required boundaries in execution, with specific non-executable diagnostics.
Knowledge-map/book and PDF plugins need actual reader controls/geometry; timed
reading needs actual native page/time semantics; slides need audio/page ownership
and joint completion. No timers, link visits or unsupported media executors added.
Live entry/manual observation is retained; no authentic child provenance/ownership
was found that could safely authorize automatic return or closing. No new grants.

Tests: all 77 earlier cases retained, 4 new meaningful integration cases = 81.
Native Chrome remains synthetic-origin/media/HTML/injection evidence, not real
course compatibility. New book-route tests explicitly substitute accessible frame
documents in jsdom; they do not prove real browser cross-origin access.
No reference code/fixtures/build/history imported; identifiers are interoperability
facts only. Build/hash verification still uses the one canonical installable.

## Consolidated future manual acceptance (after independent review)

Verify artifact/hash; objective-to-video one activation; numeric/ambiguous tabs
stop; manual native video-tab replacement cancels old player; completed prefix
is not replayed; four videos plus trailing reader; actual audio policy outcomes;
background/focus/pause recovery; Stop/reload and rest; invalid/stale credit stays
unconfirmed; unknown/special tasks stay manual; inspect each genuine PDF/book/
timed/slides/live frame and origin separately. Enable catalog navigation only
after native handler/credit review, then require one real target/context change.
Collect sanitized evidence for blocked structures together, never private HTML.

Separate proprietary knowledge-map geometry remains unverified; the ReadWeb marker
identifies the evidenced book surface only, not universal knowledge-map support.
Final checks: 81 PASS / 0 FAIL; syntax 36, imports 24; zero production dependencies.
Current sole artifact SHA-256: 04bcbfc826fd7c5c4d27f5116f536f6865b262871d612facdc8575081fa38373.

## Targeted objective/tab repair

Shared initial and explicit objective operation handles safely identified loading
content; repeated entry is deduplicated and Stop cancels acknowledgement. Explicit
Rescan does not clear persisted Stop. Core resume permits a loading-only, empty,
uniquely owned transition when explicitly requested; ordinary execution still
requires verified inventory. Current title uses the same title/text fallback.
Distinct labeled video tabs remain transitions, never click-as-completion.
Three new regression cases exercise Start/Resume/Rescan, ambiguity/missing tabs,
Stop/repeated activation and title decisions. Previous 81 tests unchanged.
No isTrusted spoofing was used; pure title decisions are synthetic evidence,
not a physical trusted-click end-to-end or authenticated platform claim.

## Final tab identity correction

Reviewed baseline dd89656848cf545db378378777b439381f13c75e. Removed tab-count
inference. Exact unique label is active; different explicit numbered labels are
distinct; generic/numbered and duplicate labels are ambiguous. Runtime acts only
on distinct trusted selections; ambiguity leaves healthy playback untouched.
No unverified native active CSS marker was invented. Title/text fallback retained.
85 tests pass, all earlier 84 retained; controlled Chromium mouse input exercises
actual trusted listener integration, transition acknowledgement, active re-click,
ambiguous no-op and Stop. Media in that mouse test is mocked; no authenticated
platform acceptance is claimed. Existing native media/HTML/artifact smoke passes.
Coordinator, scheduler, completion/navigation gates and media adapters unchanged.
Current sole artifact SHA-256: 04bcbfc826fd7c5c4d27f5116f536f6865b262871d612facdc8575081fa38373

## Authorized fork migration — partial delivery

Starting baseline 11796ff3883e3749bef78896d7ac4fd519564066. Current user policy
authorizes practical user-code reuse including rewritten inherited-method portions.
See FORK_MIGRATION_AUDIT.md for direct extraction, adapted guards, equivalent XXT
implementations retained and exact NOT migrated requirements. Fresh navigation
is enabled; saved explicit false/Stop are preserved. Positive-credit detached
catalog rebinding and known completed attachment removal are supported narrowly.
Two-area UI and accepted playback/source/scheduler protections remain unchanged.
92 tests pass, prior 87 unchanged; syntax 40, production imports 25. Native Chrome
media/HTML/artifact/Stop/trusted tabs/two-area layout checks passed. These are
synthetic/controlled-native results, never authenticated Chaoxing acceptance.
Remaining implementation work includes durable unknown deferral, full category-B
extraction, legacy terminal recovery, adaptive reader coverage and GM transport.
Current sole artifact SHA-256: ddbb547dffd1f15a746b8961008e89543437689ff072c05e340231b2b02120dd
