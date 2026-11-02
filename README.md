# XXT — canonical runtime reference

**The complete original fork is the sole execution engine.** The rewritten XXT
runtime is retired. This repository currently builds no installable userscript.
The fallback explicitly requested by the owner is active because full-file
redistribution permission for inherited upstream code was not established.

Canonical repository: [RXY712200/xuexitongScript](https://github.com/RXY712200/xuexitongScript).
Pinned revision: `351c08dc4d772908c3d098e8c9160be434bf1064`, branch
`review/v3.4.0-modular-navigation`.

- [Original complete source](https://github.com/RXY712200/xuexitongScript/blob/351c08dc4d772908c3d098e8c9160be434bf1064/v3_optimized.js)
- [Original installable in its canonical fork](https://github.com/RXY712200/xuexitongScript/blob/351c08dc4d772908c3d098e8c9160be434bf1064/v3_optimized.user.js)
- Local source: `D:\xuexitongScript-master\v3_optimized.js`.
- Local installable: `D:\xuexitongScript-master\v3_optimized.user.js`.

No copy, downloader, thin loader, modified V3 wrapper or second engine is provided
here. `dist/XXT.user.js` was withdrawn; `src/entry.js` no longer initializes XXT.
The old modules/tests/metadata are historical assets, not active production paths.
Their Git history is preserved. Do not install the old XXT script alongside V3:
disable the previous XXT installation/console injection and reload before using
only the canonical fork script. This task does not control the user's installed
Tampermonkey state or automatically install either script or the optional bridge.

## Essential verification

With the existing canonical checkout at its exact pinned branch/commit:

```text
npm run build
npm test
npm run check
npm run verify:artifact
npm ls --omit=dev
```

`build` now verifies the external source/artifact and retires only the known old
XXT artifact hash if it is still present. It never writes to the reference fork or
creates an XXT bundle. `verify:artifact` is read-only. Missing/drifted source fails;
there is no automatic download or alternative workspace. Manifest:
`runtime/canonical.json`; details: [migration record](docs/CANONICAL_RUNTIME_RESTORE.md).

Three essential tests cover policy/disabled entry, original build/body/metadata
integrity, and original full-installable bootstrap/reinjection with one active V3
instance and its original two-area UI on controlled DOM. The old 137 XXT cases and
its Chromium harness are retired acceptance evidence; they were not changed to
make V3 fit rewritten interfaces. No authenticated compatibility or release claim.

The original metadata is preserved, including `unsafeWindow`, GM storage/listener
APIs, `window.close`, `@sandbox raw`, original match patterns and document-idle.
These differ from the retired XXT grant-none metadata; they are existing fork
permissions, not silently added XXT grants. Optional live bridge remains separate.

Exact current local installable SHA-256:
`cb74e06c58f6d68c8c4f75c6a006e6fdf9be5799948ec5669237b4c3ff5cbab0`.
Pinned Git installable SHA-256:
`f5c5c5c82148aa566700934c039ad6a870e745e6b383c3739af09dfe2e0d4557`.
The difference is Git checkout CRLF conversion; neither file was rewritten here.
See [HANDOFF](docs/HANDOFF.md) and [readiness](docs/RELEASE_READINESS.md).
