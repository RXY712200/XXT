# XXT handoff — authoritative resumption entry

## Identity and acceptance

- Repository: https://github.com/RXY712200/XXT
- Canonical directory: `D:\XXT`; authorized branch: `main`.
- Phase I (01/02) accepted by ChatGPT at
  `dc3232040fa4df30ae58eeb08ebc102f2b06942e`; verified Phase II starting SHA.
- Phase II (03/04): implemented candidate, PENDING independent ChatGPT review.
  Step 03 passed 13 recognition cases and import checks before Step 04 integration.
- Latest SHA: run `git rev-parse HEAD` and compare
  `git ls-remote origin refs/heads/main`; exact delivery SHA is in the report.
  Do not hardcode this document's own commit hash or substitute a reference hash.
- The fixed plan remains five phases / ten steps. Phase III has NOT started.

## Implemented components

- `src/platform/inventory.js`: read-only page/catalog/chapter/leaf recognition,
  scoped nested frames, ordered native video/audio/document/live/assessment and
  unknown tasks, fresh owner-scoped credit, loading/unsafe outcomes.
- `src/core/contracts.js`: stable identity/evidence and execution states.
- `src/core/scheduler.js`: deduplicated cancellable deadlines and pre-effect checks.
- `src/core/completion.js`: fresh branded-inventory evidence evaluation.
- `src/core/navigation.js`: centralized short-lived single-use permits.
- `src/core/coordinator.js`: ordered one-active-task execution, generation/Stop
  cancellation, adapter and simulated navigation/ack interfaces.
- `src/runtime/session.js`: explicit one-session-per-document assembly/disposal.
- No production adapters, automatic browser bootstrap/watchers, real playback,
  scrolling/navigation/popups, settings/pacing or installables.
- See `docs/PHASE_II.md` for contracts, state model, evidence and limitations.

## Validation

- Node v24.18.1 / npm 11.16.0; minimum declared Node >=22.
- `npm test`: 32 synthetic tests, 32 PASS / 0 FAIL.
- `npm run check`: syntax of 11 JS files, imports of 7 production modules;
  relative-only production imports and no real browser/media action implementation.
- `npm ls --omit=dev`: empty; jsdom 26.1.0 is dev-only and locked.
- Fixtures independently authored with invented IDs/URLs; scripts/resources not
  executed. Inaccessible frames use null-access simulation, not browser origins.
- Phase I documents/37 feature rows/five-phase ten-step structure retained.
- Synthetic/source checks are NOT authenticated Chaoxing acceptance.

## Protected policies

- One coordinator/scheduler; adapters receive scoped callbacks/scheduler access,
  never catalog authority. Importing source performs no automatic page action.
- Completed and unknown entries remain in inventory. Local end, failure, elapsed
  time, absent DOM or a zero unfinished count cannot independently supply credit.
- Fresh identity/catalog/owner/source/order checks at starts, callbacks and permit
  consumption; changed context cancels old generations.
- Default failure policy blocks. Explicit known-task same-lesson continuation
  preserves failure and can never authorize leaving that lesson.
- Optional assessment handoff requires preceding chapter credit and a unique next
  chapter target, no verification hazard; no assessment answers/submissions.
- Normal 1.0x/background recovery/audio fallback remain mandatory future adapter
  requirements, not implemented or claimed here.
- Stop survives rebind in this session; Resume revalidates. Persistent reload Stop
  and bounded recovery belong to Phase V; there is no automatic boot now.
- New independent implementation/history. References remain read-only: fork
  `351c08dc4d772908c3d098e8c9160be434bf1064`, upstream
  `9a23b357875a72ed9bfd9e652257b0849a6855d7`. No reference code/tests imported.

## Remaining blockers / next gate

- STOP after Phase II. ChatGPT must review actual remote source, full diff,
  interfaces and tests; new user authorization is needed for Phase III.
- Phase III needs supported inner-player evidence and accepted playback,
  natural-ended, normal-speed and background recovery contracts/budgets.
- Selectors/credit patterns are conservative candidates, not a complete schema;
  authentication/assessment classification requires real validation.
- No durable completion/journal authority, rest system, manager/origin testing,
  real navigation acknowledgements, packaging or browser permission evidence.
- Later reader/live transport/grants, canonical packaging, licensing/distribution
  and authenticated acceptance remain open.
- No release/tag/PR/issue/workflow, deployment, Quiveld or website upload.
