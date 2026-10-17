# GramShakti Rice–Niger procurement extension

Prepared 17 October 2026 for `rationalvolcano-source/mango-maps-magic`.
Base: `ca22c3c98e1db3722695e7a67345b8da858d6c78` on `main`; rechecked before packaging.

## Apply the prepared implementation

Upload the one `GramShakti_Rice_Niger_Release.tar.xz` file into the existing repository root. In Lovable's terminal, run:

```sh
tar -xJf GramShakti_Rice_Niger_Release.tar.xz --strip-components=1 -C .
npm test
npm run lint -- --quiet
npx tsc --noEmit
npm run build
```

This archive overlays prepared source files; it needs no generation or new design work. Every archive entry is under `files/`. It contains no deletion instructions, credentials, raw workbooks, node_modules, generated build or git history. Preserve the existing `payload.tar.xz`, original sixteen crop canvases and latest Lovable navigation edits. The JSON change manifest records the base and current Git blob hashes; if a listed file was edited after this base, merge its newer changes before applying the overlay.

Review Rice, Niger Seeds, a state detail, a source drawer, processing, the brief, and a prior Mango/Capsicum journey in the synced preview. Publish through Lovable after review; extraction does not itself publish a public website.

## Result

- 24 new detailed procurement crops from the first 26 canonical entries, giving 40 supported detailed crops including the prior 16.
- 72 original catalog SVGs edited under the live canonical-sheet notes. Original map paths and palette are preserved. Compiler/false pressure text is removed, literal calendar windows are corrected, and source-grounded regional management and variety context are accessible.
- Existing Primary/Processed selection, month, geography, source drawer, state history, district APY/estimates, shortlist and brief components work across the cohort. Missing records remain explicit; estimates do not become official APY.
- 740 additional independent-government state rows and 304 Tamil Nadu district rows, retaining native units, crop labels and row/page provenance. Cotton/Jute bale conversions are not applied twice.
- Maize retains mismatched Wheat source content; Sugarcane lacks a dedicated approved crosswalk section and asset set. Both expose Source repair required. They are not included among the 24 new detailed crops.

The six field crops without independent-government state rows are Small Millets, Guarseed, Sesamum, Safflower, Castor and Niger Seeds. Original map snapshots and literal Production Context estimates remain available as separately labelled evidence. Barley's newest supplied official record is 2021–22.

## Evidence and checks

Canonical editor notes: https://docs.google.com/spreadsheets/d/1GZz93y1fusfbXxqElFZPahH8455yMYs_vtcLq1sdlLs/edit — `Canonical Crops — 58`, A1:Z60.

Later source preserved in Drive: https://docs.google.com/document/d/1J3ZQGbI51KarrX-dpLAqXTtFyjptqtav/edit

`field-crop-audit.json`, `artwork-audit.json` and the source/asset manifests retain the source locators, input hashes and edit decisions. README describes source regeneration.

Validation: 28 tests across four files passed; ESLint, TypeScript and the production build passed. Tests include source/crop identity, all 72 asset/geometry hashes, source month ranges, processing-node jurisdiction, Rice district expand/collapse and the source-repair routes. Original sixteen-crop values and SVGs were compared against the prior release. Representative SVGs were rendered and inspected. The new release has not yet been verified on a published Lovable deployment.

GitHub integration write attempt returned HTTP 403 (`Resource not accessible by integration`). No new branch, commit or release was pushed by this session. This single-file archive is the complete checked handoff.
