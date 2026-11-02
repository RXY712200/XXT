# Foundation replacement / developed V3 transplant

Status: implemented development candidate; PARTIAL pending independent review and
owner testing. This is the requested correction, not another phase or a clean-room
claim. The previously working fork remains untouched and is the behavior reference.

## Exact inputs and scope

- XXT starting main: `0d8a0829947cbda4de8f22cace5242cf8d5847b5`.
- Upstream: chaolucky18/xuexitongScript,
  `9a23b357875a72ed9bfd9e652257b0849a6855d7`, `v3_optimized.js`.
- Developed fork: RXY712200/xuexitongScript,
  `351c08dc4d772908c3d098e8c9160be434bf1064`, same source plus original builder
  and generated artifact as read-only integrity/metadata references.
- Source difference: +3,087 / -209 lines across 59 intervening commits (one commit
  changes fixtures only). 581/3,459 displayed rows count the terminal empty row.
- Editable production source: `D:\XXT\src\entry.js`.
- Sole generated installable: `D:\XXT\dist\XXT.user.js`.

No existing fork, upstream, working installation or reference artifact is changed.
No old full artifact is wrapped, downloaded or copied into XXT. Only this entry is
used by the builder; no retired XXT module graph is imported or initialized.

## Provenance evidence and its limits

`provenance/transplant.json` covers the entire pinned source with direct/adapted
UTF-16 offsets, one-based line ranges, segment and function hashes, 59 commit IDs,
subjects, numstats, complete primary-source patch hashes and surviving blame origins.
Its direct segments are checked against pinned Git blobs, not a mutable working copy.
The manifest records deleted/replaced upstream hunks without republishing their bodies.

The owner's explicit authorization covers their developed implementation. Source
comparison, history and existing review documentation support identifying those
subsystems; Git additions or author names alone do NOT prove ownership. No additional
foreign-code attribution was identified in the surviving developed subsystems.
This is practical provenance review, not a legal guarantee or independent ownership
certification. No upstream full-file redistribution license is inferred or added.

Classification:

- **A:** unchanged inherited bodies (tree lookup, monitor disposal, title lookup,
  event handlers/guards and accessor) are replaced with independent foundation code.
- **B:** 209 deleted/replaced upstream lines are enumerated by the exact diff hunks;
  obsolete upstream navigation, discovery and quiz behavior is not restored.
- **C:** new developed factories, discovery, credit, UI, pacing, readers, diagnostics,
  partial execution and GM lifecycle are preserved directly, with their dependencies.
- **D:** mixed methods are inspected individually. User-replaced `nextUnit`,
  `playCurrentIndex`, `_initCellData`, `_getVideoEl`, step/assessment decisions and
  `_handleVideoEnded` retain their final developed bodies byte-for-byte. Their
  remaining shared signatures, grammar and basic interface calls are not a retained
  upstream algorithm. Foundation portions in run/play/monitoring/binding/error/
  teardown are replaced or minimally adapted, recorded in the manifest.
- **E:** `bootCourse` was Git-added but relocated the inherited jQuery/bootstrap
  body; it is independently replaced, NOT counted as independently authored merely
  because the diff marked it added. No other ownership-ambiguous subsystem requiring
  omission was identified. jQuery is not copied into the installable; the existing
  CDN dependency remains the fork's normal compatibility-library dependency.

Exactly **3,099 nonempty source lines** outside adaptation spans are preserved
directly; **3,029** of those are Git-added lines. The other 70 are shared grammar,
API declarations/calls and mixed-caller scaffolding, separately enumerated in the
manifest. Additional authored guards within adapted spans are retained literally;
they are conservatively excluded from that count. **93 newly added functions/
methods** retain their complete exact source. These are integrity counts, not
copyright findings or a compatibility score.

## Independently replaced foundation and exact adaptations

The 26 adaptation records contain old/new ranges and hashes; reviewers can compare
the pinned source with the XXT entry without including upstream removed bodies here.

| Group | Foundation replacement / minimal adaptation |
| --- | --- |
| A — startup/lifetime | New `bootCourse`/`waitForCoursePage`, bounded 20-second tree wait, prior-instance destruction, owned dependency-load cleanup and inert stale onload callbacks. Public V3 keys/config/state fields remain compatible. `initializePlayer` assembly and authored recovery/Stop/bootstrap gates remain in control. |
| B — catalog | Independent `_getTreeContainer` resolves the current native tree and returns the expected jQuery wrapper. Authored `catalog`, `_initCellData`, `nextUnit`, `playCurrentIndex` and target acknowledgement are intact. `run`'s inherited reset statements are minimally restated; no alternative navigation engine. |
| C — video lookup | Final `_getVideoEl` is the user's rewritten owned-media discovery, byte-identical. The obsolete upstream broad recursive scan is not transplanted. |
| D — playback | User's final `play` keeps its task selection, delays, ownership, state, credit and failure gates; only inherited presentation strings are replaced. Basic native `play()` calls are standard browser interface use, not imported upstream bodies. Independent `_handlePlayError` implements video muted retry through the existing `_schedule`; authored audio dispatch and generation/ended/block guards remain. Audio fallback factory/methods are unchanged. |
| E — monitoring | Independent `_clearCheckInterval`, `_startVideoMonitoring`, `_checkVideoStatus` and `_tryResumePlayback`; same interval, 0.01-position sampling, 7-second stall threshold and configured resume cooldown. Authored partial-start accounting, ended priority, audio delegation, background switch and context guards retained. |
| F — events | New event-table bind/detach and loaded/play/pause bookkeeping. Same natural-ended callback into unchanged `_completeVideo`; authored 1.0x rate handler retained. No local-ended-to-credit shortcut. |
| G — steps | Independent title/text fallback and delegated step binding. Existing authored catalog binding, cancellation, LOADING reset and 1,800ms scheduled reentry are retained. Objective selection and strict assessment deferral bodies remain byte-identical. |
| H — guards/cleanup | Independent idempotent focus/visibility/mouse guard registration and matching disposal. `destroy` retains its authored UI, recovery, catalog, scheduler and controller teardown before independent base cleanup. |

New foundation differences are limited to startup resource ownership/idempotence,
fresh tree-wrapper lookup, event-table implementation, base cleanup and diagnostic
wording. High-level fork subsystems are not redesigned. Contract checks cover these
adaptations; exact real-browser equivalence is not established by those checks.

## Developed functionality retained

Direct spans preserve `catalog`/`videoAdapter`, all optional recognition adapters,
platform task/document/live adapters, `createTaskSupport` including the reader and
fail-closed optional bridge protocol, `createGMLive`, action settings/scheduler,
task pacing/rest, bounded recovery coordinator, lesson planner, decision journal,
prior credit, partial progress/recheck, native catalog acknowledgement, audio
recognition/fallback/failure handling, sequential/mixed dispatch, diagnostics,
Chinese settings panel and bottom-right notice/countdown.

No developed subsystem is omitted or substituted with an XXT equivalent. Existing
unsupported/non-executable reader/live structures remain unsupported. No assessment
answers, fake progress, invented selectors or new completion APIs are introduced.
`_block`, `stopAutomation` and recovery Stop/terminal behavior are exact developed
code: automatic block is not converted to `markExplicitStop`. Explicit user Stop
remains durable; routine recovery keeps the fork's own bounded policy.

## Metadata and distribution

Name/namespace/version describe a separate XXT development installation, avoiding
an automatic update over the working V3 installation. Original grant set, match
patterns, raw sandbox and document-idle are explicitly retained; no cross-origin
`connect`, external `require`, download/update URL or automatic optional companion.
The historical XXT grant-none/noframes metadata is superseded to preserve the already
authorized working fork's GM execution context. This is an explicit change from
retired XXT, not a silent privilege increase. No installation or activation is done.

## Observed verification and limits

- `npm run build`: deterministic metadata + single entry; no module bundler/loader.
- `npm run audit:transplant`: pinned sources, complete 59-commit inventory, exact
  spans/functions, permissions and relocated-body scan pass. A token-match scan is
  a supplementary copying check, not a copyright or semantic-equivalence proof.
- `npm run check`: active tooling/imports, entry/installable syntax and exact build.
- `npm test`: **9 pass / 0 fail**, real complete-installable execution on controlled
  jsdom pages. Cases cover single startup/UI/reinjection, delayed native player,
  audio audible rejection and same-player muted fallback, natural ended plus fresh
  platform marker, one native navigation/fresh destination/stale ended, prior-credit
  non-replay, Stop/reinjection cancellation, immediate pause/focus/stall recovery,
  unknown/verification blocking and sequential video selection.
- `npm run verify:artifact`: exact byte correspondence and SHA-256.
- Two test-development failures were corrected in the environment: inner-frame
  geometry was missing, and a long observation window included a legitimate stall
  recovery. Production rules were not weakened; test timing now measures initial
  destination playback before the separate stall test.

The 137 retired rewritten-XXT tests and three external-fallback tests remain in
history/disk but are not current production API contracts. No large legacy suite is
run or relabeled passing. The old rewritten Chrome harness remains disabled.
No actual Tampermonkey/GM isolation, popup/close policy, authenticated media, server
credit, reader geometry or live/replay environment is verified by these simulations.
The owner reports the original fork works; that does not establish this candidate's
authenticated acceptance. Independent source review comes before owner testing.

Installable SHA-256:
`bfc46537cb29ebca49f9c4d65f9562f2ed198068247f85d11f9ec55fdbf1e0e5`.
