# Readiness — DEVELOPMENT / TEST ONLY

## Current state-consistency repair

Baseline `0a93c2b7e12c051c1e5920a76b2227843862b3a4`. Current automated result:
**116 passed / 0 failed**, retaining all 104 existing scenarios. One old loading
test now requires bounded waiting, followed by Stop and no replay, instead of
immediate Stop: this is the explicit revised loading contract, not removed safety.
12 new tests call actual runtime/coordinator/storage/UI paths; grouped negative
cases include changed source/content, deadline, verification, Stop, stale callbacks,
third-attempt terminal/reinjection, busy deferral/navigation, storage failure,
corrected-task recheck, and restored progress versus independent platform credit.

`npm test`, `npm run check` (45 syntax files / 28 production imports),
`npm ls --omit=dev` (empty), `npm run build`, `npm run verify:artifact`, and
`node scripts/browser-media.mjs` are the delivery gates. Artifact:
`0fcad86bc629270e6509b317d02036c1389669ab3066b703f1c030ca1c5bc42a`.

Native Chromium adds real iframe removal/reconstruction, same-owned content
acknowledgement and localStorage restored-wait Chinese UI, with mocked media.
Existing real generated-media/policy/ended, native trusted tab input and layout
checks remain separate evidence. None is authenticated Chaoxing acceptance.
Trusted replay transport, real child binding and proprietary viewers remain
unsupported implementation/evidence dependencies. No companion or release.

Older sections below are historical and do not describe this artifact.

Current integrated follow-up starts at 36aa62cfaae9cca2d5c9caafcea34e0a796b27be.
104/104 tests pass (all previous 92 unchanged). `npm run check` validates source,
test/script syntax, side-effect-free imports and exact artifact; no runtime deps.
Native Chrome covers real generated-media ended/policy behavior, local HTML bottom,
generated injection/Stop/reload, trusted native-tab mouse selection and two-area
desktop/mobile geometry. These do not establish authenticated acceptance.
Artifact SHA-256: `24312dcdec8bf9ce8dab9e01ec4f7664d5ec97cfcc11b0afd0b8aec46ae10b48`.

Durable partial processing/explicit deferral, terminal recovery, adaptive trajectory,
per-action ranges, rest consumption and sanitized decision persistence are now
implemented. Live lifecycle state machinery is developer-only: private GM transport
and verified player binding are unwired concrete integration dependencies; no
companion, new grants, automatic return/closing/refresh or deployment. Proprietary
readers remain evidence-blocked. Migration map: FORK_MIGRATION_AUDIT.md.
Older counts/hash sections below describe previous deliveries, not this artifact.

Overall PARTIAL; independent review pending. No authenticated-platform feature
was tested. The artifact is not stable, fully compatible or production-ready.

| Feature IDs | Classification / evidence |
| --- | --- |
| F01–F03 | Implemented/synthetic; native stopped bootstrap only; actual course ownership unverified. |
| F04 | Partial: evidenced objective/video native tab activation with bounded content acknowledgement; real page validation pending. |
| F05 | Partial: fresh new-lesson acknowledgement; positive-credit same-lesson reconstruction is bounded and reverified; other changes retain manual boundaries. |
| F06–F07 | Implemented/synthetic; native video element with generated audio track at 1.0x, not actual course video. |
| F08–F10 | Synthetic background/recovery; real OS switching unverified; native policy limits remain. |
| F11 | Synthetic and native ended deduplication, independent credit retained. |
| F12–F14 | Synthetic audio success/recovery; native audio dual denial, manual intervention remains. |
| F15–F18 | Synthetic mixed order and scoped independent completion; authenticated credit patterns unverified. |
| F19–F21 | Synthetic native-port decisions/acknowledgement and assessment safety; fresh navigation ON, saved false preserved; real handler unverified. |
| F22 | Partial/native generated HTML scrolling only; PDF plugins/proprietary readers unsupported. |
| F23–F24 | Partial/manual live entry/observations; no trusted automatic return or tab closing. |
| F25 | Five structural recognition-only cases; executors remain disabled pending real controls/credit evidence. |
| F26 | Implemented/synthetic unknown preservation and fail-closed cancellation. |
| F27–F30 | Implemented/synthetic settings, integer delays, rest and persistent Stop; conservative recovery. |
| F31 | Synthetic controls; native generated panel mounting; real course overlap/visual acceptance unverified. |
| F32 | Implemented/synthetic bounded allowlisted diagnostic export; no completion authority. |
| F33 | Native generated injection/reload/duplicate owner; real Tampermonkey manager unverified. |
| F34 | Implemented deterministic build, exact synchronization, syntax and SHA-256 verification. |
| F35–F37 | Preserved exclusion/safety policies: fixed rate, no AI/answers, no force advance. |

## P0 acceptance blockers and remaining risks

- No authenticated end-to-end playback, credit or navigation acceptance.
- Isolated native catalog port is awaiting independent review and actual handler
  evidence. Keep its switch OFF; missing acknowledgement safely stops.
- Browser autoplay may prevent unattended audio even with muted fallback.
- Actual tab/window background throttling and Tampermonkey cross-frame access
  remain unverified. No grants/permission bypass or companion was invented.
- Same-lesson DOM reconstruction pauses rather than guessing executable ownership.
- Native Chrome tests are controlled synthetic-page evidence, not live-platform PASS.
- Licensing/distribution and stable release authorization remain owner decisions.

## Next real-user checklist (after independent approval)

Verify the canonical artifact/hash; install locally; inspect one ordinary video,
native audio, multi-video plus HTML document, Stop/reload, settings changes and
background recovery. Check real platform credit independently. Review/test the
native port before enabling navigation; verify exactly one target/context change.
Confirm unsupported PDF/live/unknown tasks stay manual and incomplete. Inspect
sanitized exports and real UI overlap. Record failures without removing requirements.

## Consolidation candidate

F04/F05 now support evidenced objective/video native tab flow with bounded actual
content acknowledgement. F25 now identifies five explicit structures without
execution. F31 rejects stale/unsafe UI credit. See FEATURE_GAP_CLOSURE.md for
all 37 classifications and the consolidated acceptance checklist. Remaining
proprietary reader/live and browser-policy limitations are unchanged.

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
