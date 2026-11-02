# Phase IV — historical Steps 07/08 evidence

Accepted for scoped implementation at `3fc8021a7b51d0770fbf7931a0d2aa548213e3e1`.
Authenticated compatibility remains unaccepted. Below preserves original evidence;
current product integration is documented in PHASE_V.md.

Starting/accepted Phase III SHA: `64b67cb29ed95ee03946775f43c8b9bee29c9b76`.
Status PARTIAL: independently verifiable subset implemented; authenticated
compatibility and this Phase IV candidate await acceptance. Phase V not started.

## Document/PDF boundary

`src/adapters/document.js` accepts an already identified owned native document
iframe. It inspects accessible nested HTML documents and actual clientHeight,
scrollHeight, scrollTop and computed overflow. Exactly one scrollable region is
required; multiple regions fail with reader-ambiguous-scroll-owner. Nonempty
fitting HTML with a real viewport is supported when uniquely identified.
No platform-specific viewer selectors or PDF completion endpoint were invented.
Binary PDF/plugin/object viewers and inaccessible/unknown structures are unsupported.
Thus a PDF attachment is executable only if its accessible HTML viewing surface
meets this geometry contract; this is not general browser-PDF support.

Startup waits at most 5000ms for measurable geometry. Once core enters RUNNING,
one recurring scheduler action checks reading at variable 400–900ms intervals.
Steps vary from 15–35% of the actual viewport. Completion requires stable range
and observed local bottom over three subsequent samples; no-movement, replacement
or invalid geometry fails. Dynamic ranges reset bottom stability. Already-bottom
content still requires stable observations. Stop removes pending actions; no
independent timer queue, instant full-document jump or platform credit writes.

Native evidence is limited to generic HTML scrolling within an owned iframe.
Actual authenticated PDF/knowledge-map DOM and completion behavior are unavailable.
Local reading end calls scoped done only; whole-lesson navigation still requires
the unchanged independent platform-credit evaluator and single-use permits.

## Mixed coordination

`acquireMixedSession` assembles native video/audio/document and conservative live
descriptors using the existing one-session coordinator. `autoContinue` defaults
false in the core and is enabled by this explicit assembly. Accepted local end
queues exactly one zero-delay same-lesson selection, revalidated against current
generation/context. No polling dispatcher or automatic catalog activation exists.
Owned already-credited attachments remain in inventory without replay. Unknown,
unsupported and failed tasks remain visible. Existing explicit failure-continuation
policy may be requested through core; this change does not weaken it or auto-skip
failures. Stop/context changes invalidate pending continuation before it starts.

## Live/replay security boundary

`describeLive` uses the already recognized native card, observed text and an
actually present HTTP(S) href. Labels can indicate scheduled/ongoing/replay/
unavailable, otherwise status remains unknown. No destination is constructed.
`createLiveAdapter` passively observes a trusted click on the original entry;
it never invokes/replaces its handler or assumes a popup was opened. The active
task stays waiting with a specific manual/unverified diagnostic; the parent
cannot advance during it. Live href/label changes invalidate the inventory.

`observeReplay` is an explicit read-only local-media observer, not automatic
Chaoxing child-player discovery. It checks current source/context, actual
progression and ended; 99% alone, unknown/infinite duration or elapsed time
never completes it. It may observe closure of a supplied associated handle but
cannot authenticate that handle's provenance; completionAuthority is ALWAYS false.
Messages are unconditionally rejected, closeChild always refuses, and no done,
navigation, tab-closing operation or privileged grant is exposed. Duplicate/stale
messages cannot authorize anything. Authentic opening, exact child/player/origin
evidence and reviewed transport are missing; automatic replay return is unsupported.
Manual continuation requires a fresh independent platform validation, not these
observations. No same-window message/session-ID provenance claim is made.

## Assessment and recognition-only descriptors

Existing optional chapter-assessment eligibility is preserved unchanged. Actual
handoff remains outside the implemented native-effect ports; no answer/submit
or completion mutation. Authentication and mandatory verification still block.

Five explicit descriptors (book/knowledge-map, timed reader, audio-slides,
hyperlink learning and legacy multimedia) report missing-verified-platform-structure.
Their recognizes always return false and executable is false. No authenticated
structure for these types was supplied to XXT, so inventing selectors to claim
support would violate scope. Such content remains an unknown required boundary,
never silently completed. This is descriptor infrastructure, not implemented
recognition compatibility for those five types.

## Executed verification

- `npm test`: 64 PASS, 0 FAIL; all 56 previous cases unchanged, 8 new mixed cases.
- New cases: four-video-plus-document order/credited prefix, audio/video/multiple
  documents, nested delayed geometry/dynamic range, Stop/replacement/stuck/
  ambiguity/timeout, unknown/failure boundaries, manual live wait and forged
  events, replay end/99%/premature closure/staleness, disabled descriptors and
  one coordinator ownership. These use synthetic DOM, fake media and clocks.
- `npm run check`: syntax/imports and scope guards; no new runtime dependencies.
- `npm ls --omit=dev`: empty.
- `node scripts/browser-media.mjs`: local native Chrome generated HTML scroll
  region in an iframe reaches top=range=100 incrementally and reports one local
  result. Native generated WAV video-element playback reaches real ended at 1.0x;
  audio remains denied after audible/muted attempts. No policy/security overrides.

Chrome smoke uses synthetic task ownership, not the full authenticated inventory.
No real Chaoxing PDF, live-session opening, cross-window provenance/return,
OS-background switch, server credit or Tampermonkey acceptance was established.
Reference repositories, MASTER_PLAN, existing media/source/recovery/scheduler,
completion and navigation implementations and all prior tests remain unchanged.

## Phase V gate

HANDOFF records Phase III scoped acceptance and Phase IV pending review. Feature
rows advance only to the supported PARTIAL boundary. No settings/diagnostics UI,
durable pacing/rest, installable, release or deployment was started. Independent
ChatGPT acceptance and new explicit user authorization are required before Phase V.
