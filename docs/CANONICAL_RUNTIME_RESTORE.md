# Canonical fork restoration / redistribution fallback

XXT baseline: `ae9a792c6f658ea4695fec723cb509da68cdb776`. The owner's latest
architecture decision supersedes the earlier port/rewrite production plan.
Git history remains intact; no merge, reset or force push is used.

## Redistribution evidence and selected branch

Canonical fork: RXY712200/xuexitongScript, commit
`351c08dc4d772908c3d098e8c9160be434bf1064`.
Inherited upstream baseline: chaolucky18/xuexitongScript, commit
`9a23b357875a72ed9bfd9e652257b0849a6855d7`.

Read-only tree and tracked text inspection found no project license, copying
notice or affirmative redistribution grant in these pinned versions. Current
upstream repository metadata also reports `license:null`; its default-branch
root has no license file and its current README contains no licensing statement.
The fork contains inherited upstream implementation as well as user-authored
additions. Ownership of the fork/user additions does not by itself establish
permission to mirror the entire inherited file in a separate repository.

[GitHub's licensing guidance](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)
distinguishes default copyright restrictions from GitHub's public view/fork rights.
No affirmative full-file grant was established; this is an evidence boundary,
not a comprehensive legal determination or a new license for the existing fork.

Accordingly, the explicitly authorized fallback is selected: the original fork
remains canonical runtime distribution. XXT does not copy, transform, host, bundle,
download or wrap the complete inherited engine. Attribution stays with the original
source, metadata/author and upstream history; no rebranding or substituted UI.

Canonical links:
- [Complete V3 source](https://github.com/RXY712200/xuexitongScript/blob/351c08dc4d772908c3d098e8c9160be434bf1064/v3_optimized.js)
- [Original installable](https://github.com/RXY712200/xuexitongScript/blob/351c08dc4d772908c3d098e8c9160be434bf1064/v3_optimized.user.js)

## Operational change

`src/entry.js` imports/initializes nothing. The rewritten modules remain historical,
not an alternative runtime. `dist/XXT.user.js` is removed from the current tree;
its previous content is recoverable from unchanged Git history. Build refuses to
remove an unexpected file at that path; only the known previous generated hash may
be retired. No second project directory, new installable, injected loader or
optional companion is created. No changes are made to either reference repository.

`npm run build` now verifies the existing canonical checkout/source/installable
and withdraws the known old XXT artifact. `verify:artifact` is read-only and
requires the old artifact to be absent. Missing checkout, wrong branch/HEAD,
modified canonical files, hash drift, metadata changes or a revived rewritten
entry fail verification. There is no network fallback/download.

Original builder integrity is checked in memory using its pinned literal metadata
and complete source body; the source builder is not executed against read-only
files. Git blob hashes are verified exactly. Local CRLF bytes are separately hashed
and must normalize exactly to those blobs. No source behavior is patched or
reimplemented using XXT inventory/coordinator/navigation APIs.

Metadata stays original: HTTP/HTTPS course matches and zhibo match, document-idle,
raw sandbox, unsafeWindow, GM get/set/delete and value-change listener/removal,
window.close. These are broader existing permissions than retired XXT grant-none;
they are documented, not silently added to XXT. The optional bridge remains a
separate owner decision; the policy's false flag means this task never installs it,
not that the user's manager was inspected. Separate DeepSeek code is untouched.

## Essential checks / retired tests

3 focused tests execute actual canonical file bytes on controlled DOM:
1. External single-engine policy, disabled rewritten entry and no XXT installable.
2. Original complete source/artifact syntax, metadata, hashes and builder assembly.
3. Original installable boots one V3 app and its own two-area UI. A repeated boot
   callback does not duplicate it; full reinjection destroys the previous app,
   preserving the fork's existing replacement semantics rather than forcing XXT's
   singleton behavior. No window.XXT or rewritten engine is initialized.

The test's DOM, jQuery surface and timers are environment shims, not modifications
to V3 source/methods. GM manager, actual browser permissions, media playback,
server credit and authenticated course compatibility are not established here.

The following previous acceptance assets are preserved but no longer applicable
to production: core/coordinator/navigation permit, inventory, media adapter,
recurring scheduler, mixed-session, product/UI, tab-repair, migration/state-consistency,
restored-credit and navigation-status tests in tests/*.test.js (137 old cases).
They assert rewritten APIs, XXT selectors, its diagnostic schema and generated
bundle, which are not contracts imposed on the original fork. npm test explicitly
selects canonical-runtime.test.js; it does not count these old cases as passing.
The historical scripts/browser-media.mjs refuses execution before starting Chrome
or serving the rewritten modules. No hundreds-case simulation is added.

## Acceptance and user transition

Only the original fork's complete engine is intended to run. The user must disable
old XXT userscripts/console injection and reload before using the canonical script;
this task cannot establish the user's installed Tampermonkey state or remove an
already running script from an authenticated tab. No automatic installation occurs.

No claim of real manager initialization, browser-policy compatibility, authenticated
Chaoxing acceptance or stable release is made. Independent review and user testing
are still required. No source-fork/upstream writes, PRs, Issues, tags or Releases.
