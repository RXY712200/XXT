# Phase V candidate — Steps 09/10

Accepted starting baseline: `3fc8021a7b51d0770fbf7931a0d2aa548213e3e1`.
Status PARTIAL / DEVELOPMENT TEST BUILD. No authenticated acceptance or release.
The fixed five-phase/ten-step MASTER_PLAN is unchanged.

Canonical source is `D:\XXT\src` ES modules, entry `src/entry.js`; metadata is
`userscript/metadata.json`. Only generated installable: `D:\XXT\dist\XXT.user.js`.
Run npm run build, npm test, npm run check, npm ls --omit=dev,
node scripts/browser-media.mjs, npm run verify:artifact. Verify independently with
Get-FileHash -Algorithm SHA256 -LiteralPath D:\XXT\dist\XXT.user.js.
Generated LF bytes are fixed by .gitattributes; never edit the artifact manually.
Exact generated SHA-256:
`6e9c2c0faf1f4ee53dd3c822047665dd30e0dfa4cfecd8539f3c475a509bfb54`.
Final commands: npm test = 77 PASS / 0 FAIL; npm run check = 33 syntax files,
22 production imports plus exact artifact; npm ls --omit=dev = empty;
npm run build and npm run verify:artifact agree with independent PowerShell hash.
Two builds from unchanged modules produced identical bytes. Native Chrome smoke
passed media policy/end, HTML reading, generated UI/duplicate injection and reload Stop.

## Runtime and authority

Explicit document-idle entry checks supported HTTPS course paths. A shared page
Symbol prevents console/userscript duplicate owners. One existing coordinator and
scheduler own media, readiness, runtime monitoring, delays and rest eligibility.
Initial readiness and new-lesson content confirmation are bounded to 10 seconds.
Catalog change alone cannot restart an old player. Same-lesson replacement stops
for explicit rescan rather than restoring uncredited local completion from a log.

Native-navigation.js is the only catalog click port. Navigation defaults OFF
pending independent review and real course testing. It rechecks source/target,
then requires actual target identity AND changed content, not click success.
After a long randomized delay, only an original branded unused permit may be
renewed against fresh independent evidence; its original scope cannot change.
Normal permit expiry tests remain unchanged. Missing acknowledgement stops safely.

## Settings, persistence and UI

Chinese collapsible shadow panel provides Start/Stop/Resume/rescan, independent
automation/video/audio/document/continuation/navigation/background switches,
delay ranges, rest configuration, defaults and sanitized diagnostics.
Only task kind/position is displayed, not course/account identifiers.
Local completion and platform credit are separate; live is manual, not playback success.

Versioned localStorage key xxt.state.v1 stores validated settings, explicit Stop,
rest deadline/count and exact stable processed-content keys. Version 0 has an
explicit settings/Stop migration; unknown/corrupt/unavailable storage fails closed.
Default transition delay is inclusive integer 5000–12000ms, one draw per action;
initial start, recovery and Stop have no artificial delay. Affected pending work
is cancelled; disabling unrelated audio does not interrupt a healthy video.

Rest is disabled with null quota/duration by default. User must configure both.
Only accepted local natural video/audio ends or actual document-bottom results
count, once per content key. Live opens, failures and unknowns never count.
These local processing records NEVER supply platform credit or task skipping.
2048-key capacity fails closed rather than evicting deduplication authority.
Restore Defaults explicitly resets invalid/capacity state while retaining Stop.
Stop does not erase a rest deadline. No persistent reload/retry storm is installed.

Diagnostics retain at most 100 allowlisted category/state/kind records. Export
contains no URLs, IDs, pacing keys, HTML, credentials, timestamps or private messages.
LocalStorage itself contains private pacing identities and is readable by same-origin
page JavaScript; it is not authenticated authority. No telemetry/external service.

## Evidence and limits

All 64 prior tests are retained; 13 product tests cover persistence/migration,
delays/rest, feature changes, lifecycle, native port decisions/acknowledgement,
sanitized export, UI and generated/console ownership. Native Chrome checks real
generated-script injection, duplicate panel prevention and Stop after reload on
a fully intercepted synthetic page, plus existing native media/HTML geometry.
No authenticated page or policy/security override is used.

Audio can still receive two policy denials. PDF plugins, proprietary readers,
five disabled descriptors and automatic live return remain unsupported/manual.
Real catalog handlers, Tampermonkey isolation, OS background behavior and credit
patterns require authenticated user acceptance. No stable release, tag, PR,
Issue, deployment, website upload or reference-code import is authorized/performed.
