# XXT handoff — original fork is canonical

## Current decision

Starting XXT/main SHA `ae9a792c6f658ea4695fec723cb509da68cdb776`.
Final SHA is the commit containing this file; compare HEAD with origin/main.
The owner rejected the rewritten architecture as production preference. Do not
restart migration, port the old engine to XXT interfaces, or create a new phase.
The complete original fork at `351c08dc4d772908c3d098e8c9160be434bf1064` is the
behavior baseline. Full-file redistribution rights were not established, so the
owner-authorized external-canonical fallback is active. XXT distributes no engine.

## Canonical paths / source identity

- XXT reference/control workspace: `D:\XXT`, RXY712200/XXT, main.
- Read-only canonical source checkout: `D:\xuexitongScript-master`.
- Origin: RXY712200/xuexitongScript, review/v3.4.0-modular-navigation.
- Exact source: `D:\xuexitongScript-master\v3_optimized.js`.
- Exact original installable: `D:\xuexitongScript-master\v3_optimized.user.js`.
- Never modify these references in XXT work or create a parallel production copy.
- `runtime/canonical.json` pins commit, source/builder/artifact hashes and metadata.
- `src/entry.js` is inert; other `src/` modules and userscript metadata are historical.
- `dist/XXT.user.js` is withdrawn. No replacement wrapper, loader or installer.

Disk source SHA-256:
`597653fea61c2bd2527c07209cd5d56c2f37eaba1a0ac5404696aa8d0ae4b554`.
Disk installable SHA-256:
`cb74e06c58f6d68c8c4f75c6a006e6fdf9be5799948ec5669237b4c3ff5cbab0`.
Pinned Git source SHA-256:
`defc7d519b29150fb66b1858aecd0e2db484b9b5019974d735bf0a9707babb22`.
Pinned Git artifact SHA-256:
`f5c5c5c82148aa566700934c039ad6a870e745e6b383c3739af09dfe2e0d4557`.
Working checkout uses CRLF. Verification checks exact disk hashes, normalized
pinned blobs, original literal metadata + full original body assembly. It does not
run the reference builder against disk or write any canonical source file.

## Rights and behavior boundary

No project LICENSE/COPYING/NOTICE or affirmative grant was found in the pinned
upstream/fork or reviewed source/READMEs. Current upstream API reports license:null.
GitHub's view/fork facility does not establish separate full-file redistribution
permission. See CANONICAL_RUNTIME_RESTORE.md for evidence and official guidance.
This is not a declaration that the existing fork has acquired a license.

Startup/discovery/playback/completion/navigation/recovery/UI remain byte-identical
to the canonical engine. Preserve its original sandbox/matches/run-at/grants:
unsafeWindow, GM get/set/delete/listener/remove-listener and window.close. No
XXT permission reinterpretation. Do not install optional live bridge automatically.
No AI/assessment answering/progress fabrication or additional automation was added.

## Verification / historical acceptance

Run npm run build, npm test, npm run check, npm run verify:artifact and npm ls --omit=dev.
Build means external verification, not generation. Missing/drifted checkout fails.
3 essential tests pass: sole-engine policy/inert entry, original syntax/build
integrity/metadata, and full original installable initialization plus reinjection
(old instance destroyed, one live V3 instance/original UI, no XXT runtime).
The DOM/jQuery/clock environment is controlled; engine methods are not patched.
This is not real Tampermonkey/GM/browser-policy/authenticated-course acceptance.
The historical 137 XXT cases/Chromium smoke are not acceptance gates for V3. Their
assets remain for history; the old browser harness now refuses execution.

Before real testing, the user must disable previous XXT installs/console injections
and reload, using only the canonical original script. No installed manager state
was changed here. Independent review and real-platform testing remain pending.
Preserve all Git history; push one correction only to XXT/main. No reference writes,
PR/Issue/tag/release/force-push/deployment. Stop after this delivery.
