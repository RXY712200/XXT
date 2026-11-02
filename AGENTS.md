# XXT collaboration rules

## Current owner decision — takes precedence over historical rewrite rules

- Starting baseline ae9a792c6f658ea4695fec723cb509da68cdb776. The complete original
  fork at 351c08dc4d772908c3d098e8c9160be434bf1064 is the behavior baseline, not
  XXT's inventory/coordinator/navigation implementation. Do not port it again.
- Full-file inherited redistribution permission was not established. The explicitly
  authorized fallback is active: keep the existing fork as canonical distribution;
  no complete source copy, mirrored installable, downloader or wrapper in XXT.
- Canonical read-only source: D:\xuexitongScript-master\v3_optimized.js. Original
  installable: D:\xuexitongScript-master\v3_optimized.user.js. Preserve its exact
  source, original two-area UI, metadata and grants; no source-fork/upstream writes.
- src/entry.js is inert. Other rewritten modules, tests and userscript metadata
  remain historical assets. dist/XXT.user.js is withdrawn; never regenerate it
  from those modules. scripts/build-userscript.mjs now verifies the pinned external
  source/artifact only and retires the known previous XXT artifact hash.
- npm test selects only three canonical integrity/bootstrap tests. Historical
  rewritten suites and native harness are no longer production acceptance gates;
  do not change original V3 behavior to make them pass. Preserve Git history.
- Never initialize both engines or automatically install the optional live bridge.
  Real manager state/authenticated compatibility is unverified. Stop after this
  coherent XXT/main delivery for independent review; no release/deployment.
- See docs/CANONICAL_RUNTIME_RESTORE.md and current HANDOFF. Historical constraints
  below apply only where compatible with this explicit architecture decision.

## Authority and scope

- The user owns product requirements and final authorization. ChatGPT owns
  architecture, implementation decisions, scope and acceptance. Codex implements
  the approved scope and reports observed evidence without overstating it.
- Work only in `D:\XXT`, repository `RXY712200/XXT`, on the authorized branch.
  If identity, branch, baseline or canonical paths disagree, stop and report.
- Read `docs/HANDOFF.md`, `docs/MASTER_PLAN.md` and the relevant feature rows first.
  HANDOFF is the authoritative resumption entry point; recheck its Git claims.
- Phase IV is accepted at `3fc8021a7b51d0770fbf7931a0d2aa548213e3e1`.
  Current authorization covers one consolidated pre-acceptance feature-gap correction,
  based on reviewed SHA 5f91168074a8df13af850080178e45f43cb980a7.
  Stop after delivery; independent acceptance and explicit user authorization are
  required before real-user acceptance/release. Preserve five phases / ten steps.
- Stop an affected portion when a protected decision must change. Report the
  concrete dependency for ChatGPT; do not silently alter the contract.

## Authorized source reuse and provenance

- Current migration authorization supersedes the former blanket no-reuse rule.
  User-developed additions and rewritten portions of inherited methods may be
  extracted from fork 351c08dc4d772908c3d098e8c9160be434bf1064, compared against
  upstream 9a23b357875a72ed9bfd9e652257b0849a6855d7. References stay READ ONLY.
- Check practical provenance/history, preserve attribution and adapt interfaces.
  Do not blindly import an inherited whole method or treat authorship alone as
  proof of ownership. Record direct/adapted reuse and retained equivalents.
- No reference Git history import, private fixtures or unrelated repository edits.
- Integrated remaining migration authorization starts at 36aa62cfaae9cca2d5c9caafcea34e0a796b27be.
  Finish the requested subsystems in one correction; no new phase. Durable partial
  results and journals are never credit. The extracted recovery uses the existing
  scheduler; terminal exhaustion cannot be cleared by late callbacks. Developer
  replay lifecycle infrastructure has no installed privileged transport: never
  silently connect page messages, expand grants, refresh or close a tab.

## Protected product decisions

- Use fixed 1.0x for video, audio and finite replay; never seek ahead or fabricate
  duration, progress, attendance, completion or platform credit.
- Recognition, local execution and platform completion are distinct evidence.
  Failed, unknown and non-executable tasks remain unresolved, not completed.
- One coordinator and one cancellable scheduler control execution. Adapters never
  navigate the catalog. Validate identity, inventory revision and generation before
  acting; stale callbacks cannot start a new task or authorize navigation.
- Background/focus-loss, pause and stall recovery are core playback requirements.
  Recovery checks, Stop and security checks are not delayed content transitions.
- Do not answer or submit chapter tests. Authentication, CAPTCHA and mandatory
  verification are not optional assessment handoffs.
- No AI answering service, fake trusted interaction, permission bypass, fabricated
  mouse activity or browser-fingerprint spoofing. Respect actual browser limits.
- Do not close unowned tabs or trust same-window messages as authenticated sender
  proof. Unverified live completion/closure cannot authorize continuation.

## Evidence and delivery

- Distinguish source inspection, synthetic tests, user-reported authenticated
  observations and independently reproduced live evidence. Counts of mock tests
  do not establish real compatibility. Report PARTIAL/FAIL when warranted.
- Reuse focused tests. Add meaningful regression cases, not combinatorial coverage
  for its own sake. Keep failures visible and explain approved expectation changes.
- Phase V permits controlled browser integration, Chinese UI, local settings/
  Stop/rest, sanitized diagnostics and development userscript generation. No stable
  claim, Release/tag/deployment or website upload is authorized.
- Canonical production: existing ES modules under `D:\XXT\src`, entry
  `src/entry.js`, metadata `userscript/metadata.json`. Sole generated installable:
  `D:\XXT\dist\XXT.user.js`. Never hand-edit it. Regenerate with `npm run build`;
  check `npm run verify:artifact` and exact SHA-256. No silent alternative or companion.
- Update HANDOFF after each authorized delivery: phase, acceptance, baseline,
  deliverables, blockers, tests, protected decisions and next authorization.
  Keep it under 200 lines. Obtain the latest SHA from `git rev-parse HEAD`; do not
  put a stale or self-referential hardcoded hash in a file committed by that hash.
- Review all staged content for privacy; stage explicit paths. This repository is
  public: never publish private course HTML, credentials, cookies, account IDs,
  authenticated URLs or session data. Ignore rules do not replace review.
- Only push to the explicitly authorized XXT ref. Never force-push, rewrite
  unrelated history, or create upstream PRs/issues/comments, tags or releases.
- No website upload, deployment, Quiveld changes or unrequested workflows. Stop
  aggressive network activity on 403/429 or rate-limit signals.
- Completion reports include actual SHA/ref verification, changed files, validation
  and limitations. If no production/installable exists, say so; do not invent a
  build, installable path, artifact hash or authenticated PASS.
