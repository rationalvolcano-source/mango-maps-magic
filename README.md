# GramShakti

Source-backed crop procurement research using the original GramShakti artwork. The current release provides detailed procurement journeys for Mango, Banana, Oranges, Guava, Grapes, Papaya, Pineapple, Pomegranate, Apple, Litchi, Sapota, Jackfruit, Potato, Onion, Tomato and Capsicum.

## Procurement workflow

Welcome → three objectives → original 58-crop directory → crop sourcing → state detail, processing geography or regional crop protection → shareable, printable sourcing brief.

Fresh/Processed, month and production year stay in the URL. Availability filters use named source windows, including storage and protected-production qualifiers. The original visual is a fixed snapshot; the records below it follow the selection.

Clicking a state opens exact official production, a history with visible missing years, compact district APY and separately labelled Production Context estimates. District records retain their own years and native units. Missing fields are never zero-filled, and district sums never replace official state production.

The browser shortlist is scoped to crop, purpose, month and year. A brief URL contains the selected public source-record IDs, so another reader can open the same brief without an account. Print/Save PDF uses the browser.

Opportunity/FPO Discovery and CLIM remain development shells. The remaining canonical crops display their actual release/source-repair status.

## Evidence and original artwork

- 3,201 cached official state-production records.
- 198 exact availability rows, 83 commercial-belt rows and 53 processing-node contexts.
- 410 district records: 380 Tamil Nadu records across ten crops for 2024–25, plus 30 Karnataka Onion records for 2021–22.
- 48 original crop SVG hashes checked against the existing crop manifests. Original map path geometry is preserved in every application copy.
- Original SH-001 background, logo and PR-001 directory are packaged with the app.
- Exact document block/table/row and workbook row/page provenance are available in evidence drawers.

Mango has 29 state/UT production records for 2024–25. Capsicum has three, classified as second advance estimates; missing states remain missing. Other crops have varying current/historical coverage. Litchi's newest cached official year is 2015–16. The year selector makes older records explicit.

Production Context estimates retain their literal reporting basis and never borrow production quantities from the crosswalk. Regional calendar varieties attached to a processing node are labelled as regional context; processor acceptance remains unverified.

State identity includes the supplied numeric LGD codes. This release does not fabricate district LGD reconciliation or historical boundary allocations. Node jurisdiction, catchment and commercial belt are distinct.

## Approved visual corrections

Original compositions, maps and palette are reused. Application copies remove compiler/footer copy and unsupported pesticide-pressure tiers. Regional pest/management cards retain actual source modes and omit dose/schedule/PHI prescriptions.

The supplied decision register governs belt membership, mapped varieties, the Panruti/Cuddalore consolidation and pin/state repairs. Pins are explicitly indicative state positions, not verified district centroids.

Two source constraints are preserved: the unsupported Potato Kashipur–Rudrapur processing corridor is not invented; Hooghly/Birbhum remains source-backed Capsicum context pending an explicit editorial override.

## Run and verify

Use the existing Node/npm or Bun environment:

```sh
npm install
npm run dev
npm run build
npm test
npm run lint
npx tsc --noEmit
```

The production frontend makes no Drive, AI, price, weather or lending API requests. It loads its prepared source snapshots and local artwork. Google Fonts is the existing optional external font resource.

## Data and application structure

- `src/components/gramshakti/asset-viewer.tsx`: cached, sanitized original SVG interaction.
- `procurement-details.tsx`: all-crop detail records, state history, district APY and briefs.
- `src/lib/gramshakti/procurement.ts`: source/identity, native-unit and month-window logic.
- `procurement-records.json`: extracted exact source statements and district records.
- `official-records.json`: existing official state-production snapshot.
- `asset-manifest.json` and `artwork-audit.json`: original/application provenance and checks.
- `public/gramshakti`: the actual artwork bytes; no runtime dependency on Lovable's private asset pointers.

Optional source regeneration requires Python and openpyxl plus the original Drive snapshots. The source directory must contain `crosswalks.docx`, `production-context.docx`, `district-apy.xlsx` and `originals/{crop}-{002,003,006}.svg`, with `originals/directory.svg`. Preserve the approved LGD source pack alongside that directory.

```sh
python scripts/build_procurement_data.py SOURCE_DIRECTORY
python scripts/prepare_procurement_artwork.py SOURCE_DIRECTORY
```

These scripts reject missing source sections and mismatched original SVG hashes. They do not synthesize official APY or generate replacement imagery.

## Publish

Keep this existing repository linked to the existing Lovable project. After the code is applied to the synced branch, open its preview, then publish the current changes using Lovable. Git synchronization by itself does not update the published frontend. Verify the signed-out public welcome, Mango, Capsicum and their state/source/brief deep links after publishing.

