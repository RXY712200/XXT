# XXT handoff — Phase V candidate

## Current state-consistency correction

Reviewed starting SHA `0a93c2b7e12c051c1e5920a76b2227843862b3a4`; final SHA is the
commit containing this section. Verify HEAD against origin/main. This section
supersedes the historical delivery counts/hashes below. No new phase.

Three fixes: (1) unfinished, independently owned same-lesson loading can wait up
to 10s after old work is cancelled. Waits consume the existing persisted budget;
attempt 3 is terminal without reload. Ready replacements need fresh ownership,
exact content/source/ordinal identity and stable page/catalog context. Changed
source, verification, competing media, Stop or timeout never adopts a player.
Previously credited content still needs fresh authoritative credit. (2) The
coordinator rejects busy/stale deferral before persistence, then persists and
applies its exact synchronous key decision. Storage failure changes neither
private partial state nor coordinator authority. (3) durable local-ended records
use RESTORED_WAITING_PLATFORM, not PENDING or invented RUNNING/ended history.
The UI says restored local processing, not platform credit. Runtime navigation
uses the stricter completed gate; restored records cannot replace genuine-ended
evidence, so independent task credit is required for those records.

Canonical source: `D:\XXT\src\` (entry `src/entry.js`); generated installable:
`D:\XXT\dist\XXT.user.js`, SHA-256
`0fcad86bc629270e6509b317d02036c1389669ab3066b703f1c030ca1c5bc42a`.
Validation: 116 PASS / 0 FAIL (104 existing scenarios + 12 focused regressions),
syntax 45 files, 28 production imports, zero production dependencies; exact
build/verification. Existing DOM-replacement test retains no-replay/Stop checks,
but now expects the authorized finite wait before Stop rather than immediate Stop.
Native Chrome includes real iframe reconstruction and restored localStorage/UI
integration with mocked playback; existing real generated-media policy/end,
native trusted mouse and two-area layout checks are retained. No authenticated
platform session or permission bypass. See RELEASE_READINESS for evidence limits.

Frozen engines, source verification, scheduler, navigation permit/effect port,
completion evaluator, adaptive reader, replay developer module, metadata and
MASTER_PLAN remain unchanged. Two-area hosts/styles unchanged; only new state text.
No optional live bridge or grants changed; trusted live transport/child binding and
proprietary readers remain blocked as documented. No stable release or authenticated
acceptance. Push only XXT/main, then stop for independent review.

## Current integrated migration follow-up

Starting SHA `36aa62cfaae9cca2d5c9caafcea34e0a796b27be`; final SHA is the commit
containing this section (verify HEAD and origin/main rather than a self-reference).
Previous delivery paragraphs below are historical. Current result: **104 PASS /
0 FAIL**, retaining all 92 baseline tests unchanged. Canonical artifact:
`D:\XXT\dist\XXT.user.js`, SHA-256
`24312dcdec8bf9ce8dab9e01ec4f7664d5ec97cfcc11b0afd0b8aec46ae10b48`.
Production sources remain `D:\XXT\src\`; entry `src/entry.js`.

See the CURRENT section in FORK_MIGRATION_AUDIT.md for each direct/adapted reuse,
retained equivalent and distinct implementation/evidence dependency. Recovery
factory extracted from user-added source, no inherited playback engine copied.
All reference checkouts remain read-only. MASTER_PLAN stays byte-unchanged.

New integration: reverified credited-video iframe/catalog reconstruction; bounded
10s wait; exact-scope local progress and explicit unknown deferral/recheck; durable
three-attempt recovery (attempt 3 stops, never reloads); 5–7s adaptive HTML reader;
ten independent range overrides; durable sanitized decision journal; rest consumes
one transition delay without stacking. Genuine trusted tab acknowledgement is an
explicit recheck; unknown/processed-scope changes otherwise remain conservative.
Navigation failure/timeout never enters media recovery. Fresh navigation ON,
saved false/Stop retained. Two-area hosts/layout and one scheduler preserved.

Replay claim/ack/liveness/terminal/expiry/retry machinery is implemented and tested
as an unbundled developer API. **No privileged transport or optional companion is
installed.** Grant-none core has no trusted cross-window sender; connecting GM,
real child/player binding, self-close/refresh/credit handoff needs explicit reviewed
capabilities. Automatic return stays disabled; proprietary PDF/knowledge-map
executors remain unsupported. These are implementation dependencies, not merely
untested features. No authenticated Chaoxing or stable-release acceptance.

Verification commands: `npm test`, `npm run check`, `npm ls --omit=dev`,
`npm run build`, `npm run verify:artifact`, `node scripts/browser-media.mjs`.
Tests call actual XXT modules and generated runtime. Native smoke uses generated
media and intercepted synthetic pages, never an authenticated session. Audio dual
policy denial is a valid unresolved result; no permission flags were added.
Stop after this integrated correction; no additional phase/release authorized.

Accepted Phase IV baseline: `3fc8021a7b51d0770fbf7931a0d2aa548213e3e1`.
Current SHA: git rev-parse HEAD; compare git ls-remote origin refs/heads/main.
Root D:\XXT; repository RXY712200/XXT; branch main.
Phase V Steps 09/10 implemented candidate, independent review PENDING.
Authenticated compatibility and release remain unaccepted.

Canonical source: existing src ES modules; entry src/entry.js.
Metadata: userscript/metadata.json. Sole generated file: D:\XXT\dist\XXT.user.js.
Never hand-edit it. npm run build; npm run verify:artifact; Get-FileHash SHA256.
Exact installable SHA-256:
ddbb547dffd1f15a746b8961008e89543437689ff072c05e340231b2b02120dd
Current correction: 87 PASS / 0 FAIL; syntax 38 files, production imports 24.
Build/verification/PowerShell hash agree; no production dependencies.

See PHASE_V.md and RELEASE_READINESS.md for contracts, evidence and blockers.
Chinese UI, validated settings, persistent Stop/rest, sanitized diagnostics and
isolated native navigation port are integrated. Fresh navigation defaults ON;
saved explicit false remains false and persistent Stop still wins.
All 64 previous tests retained; 13 new product cases. No runtime dependencies.
Chrome smoke uses intercepted synthetic pages, not authenticated platform data.
PDF plugins/proprietary readers, five disabled descriptors and automatic live
return remain unsupported/manual. Audio policy may still deny muted fallback.
No stable release/tag/PR/Issue/deployment/website upload or reference mutation.
Five phases/ten steps unchanged. STOP after this delivery pending independent review.

Pre-acceptance consolidation starting SHA 5f91168074a8df13af850080178e45f43cb980a7.
Native objective/video-tab handling, specific non-executable special recognition
and fresh UI credit validation added; FEATURE_GAP_CLOSURE.md classifies all 37.
Final consolidation: 81 synthetic cases; authenticated acceptance PENDING.
Current artifact SHA-256: ddbb547dffd1f15a746b8961008e89543437689ff072c05e340231b2b02120dd

Targeted correction baseline: 6c3ef4d454a3617e71cf5fcf945e76ace824db99.
Initial/explicit objective transitions share one operation. Rescan preserves Stop;
only Start/Resume clear it. Active video title/text fallback is unified.
Independent review and authenticated compatibility remain PENDING.

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
Current sole artifact SHA-256: ddbb547dffd1f15a746b8961008e89543437689ff072c05e340231b2b02120dd

## Two-area UI correction

Starting baseline 76c1411dc934d982bb10021ae3a85d319b8e772c. Read-only pinned
fork 351c08dc4d772908c3d098e8c9160be434bf1064 confirmed notice right=8px,
bottom=86px, max-width=290px and top settings right/top=8px, 264px content,
65vh maximum, Chinese learning-settings summary and collapsible task/diagnostics.
Independent XXT code restores two Shadow hosts, one renderer/cleanup, always-visible
polite notice and supported quick actions, grouped detailed settings and report
selection. No fake manual type selector or inert legacy controls were added.
Quick re-detection calls the existing explicit Start operation, including storage/
Stop validation; no UI completion or navigation authority.
All runtime/media/core/settings/diagnostic logic is byte-unchanged; only UI source,
focused tests/harness, evidence docs and regenerated installable changed.
87 PASS / 0 FAIL, previous 85 retained; syntax 38, imports 24; no runtime deps.
Native Chromium computed geometry at 1280x900 and 320x480 with long Chinese text
verified 8px top/right, 86px bottom, separate visible hosts, internal scrolling,
no offscreen bounds and actual pointer hit-testing. Settings content heights were
261px/140px, notice heights 274px/169px. Narrow-view overlap found during QA was
corrected with a responsive upper height cap. No private screenshots committed.
Full native media/reader/generated-injection/trusted-tab smoke passed. These are
synthetic page checks, not authenticated course layout or compatibility acceptance.
Current artifact SHA-256: ddbb547dffd1f15a746b8961008e89543437689ff072c05e340231b2b02120dd

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
