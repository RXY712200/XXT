# XXT — developed V3 transplant / development candidate

XXT now contains one engine: the user-developed fork implementation transplanted
intact around an independently written replacement for its inherited foundation.
This supersedes the external-canonical fallback. It does not revive the retired
XXT coordinator or port the fork through that coordinator's interfaces.

**PARTIAL: independent source review and authenticated owner acceptance pending.**
The working fork and installed script are not changed or automatically replaced.

## Source, artifact and attribution

- Editable production source: `src/entry.js`.
- Sole generated installable: `dist/XXT.user.js` (development candidate only).
- Behavior reference: [RXY712200/xuexitongScript at 351c08dc](https://github.com/RXY712200/xuexitongScript/tree/351c08dc4d772908c3d098e8c9160be434bf1064).
- Inherited foundation reference: [chaolucky18/xuexitongScript at 9a23b357](https://github.com/chaolucky18/xuexitongScript/tree/9a23b357875a72ed9bfd9e652257b0849a6855d7).
- Source provenance, all 59 commits, exact preserved/adapted ranges and hashes:
  `provenance/transplant.json` and [migration record](docs/FOUNDATION_TRANSPLANT.md).

The owner authorizes their developed additions. No inherited upstream full-file
license is inferred. Inherited foundation bodies are independently replaced; Git
additions alone are not treated as ownership proof. No clean-room claim is made.
All 93 directly retained new functions/methods and 3,029 directly retained Git-added
nonempty lines are checked against the pinned fork. Mixed adaptations are explicit.

## Preserved behavior

The fork's own task discovery, sequential/mixed media, document reading, platform
credit gates, navigation, pacing/rest, recovery, diagnostics, Chinese settings and
bottom-right status remain in control. Normal speed stays 1.0x. Local ended records
never become platform credit. Unknown tasks and security hazards retain their
existing boundaries. Supported and unsupported paths remain those of the fork;
no reader, live URL, completion API or assessment automation is invented.

Userscript permissions/matches/raw context retain the working fork's existing
unsafeWindow, GM storage/listener and window.close grants. These explicitly replace
retired XXT's grant-none metadata; no additional cross-origin grants are introduced.
Distinct XXT name/namespace prevents overwriting the working V3 installation.
No optional bridge is bundled or installed. No install/activation is automatic.

## Essential development checks

Node 22+; `npm ci` installs development-only parser, DOM and jQuery test dependencies.
The read-only pinned checkout is needed for provenance checks at
`D:\xuexitongScript-master`; building the self-contained entry needs no reference
source or network download.

```text
npm run build
npm run audit:transplant
npm run check
npm test
npm run verify:artifact
```

Nine focused tests check complete-script startup, own UI, reinjection, delayed
owned media, audio fallback, natural ended/independent credit, guarded one-time
native navigation, prior-credit non-replay, Stop, recovery and sequential videos.
These are controlled DOM/media/timer simulations, not actual Tampermonkey, browser
policy or authenticated Chaoxing verification. Historical rewrite/fallback tests
are retained but are no longer production contracts.

Artifact SHA-256:
`bfc46537cb29ebca49f9c4d65f9562f2ed198068247f85d11f9ec55fdbf1e0e5`.

No release, tag, deployment or automated installation is provided. Review this
candidate before replacing anything in the owner's actual browser.
