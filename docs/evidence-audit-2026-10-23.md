# GramShakti: source and artwork audit

23 October 2026 · reviewed against repository commit `716faa018a5f97ab27277694a305ed3788874fa2`.

**The documents and extracted source cells agree; several display and placement operations do not.** This package supplies a guarded code patch and prepared application SVG copies. Nothing has been pushed, synced to Lovable or published.

## What was checked

- Current original Cross Walks, Cross Walks-2.0, PRODUCTION CONTEXT and the 12 October visual-correction decision register were read.
- 1,786 availability-calendar cells, 796 belt-table cells and 1,680 Production Context table cells matched the documents: **4,262/4,262**, with no unmatched cell.
- All **529 paragraphs** attached to the **125 processing contexts** matched their source documents.
- All 40 crop payloads, 199 belt rows, 415 calendar rows, 120 application SVG structures and 205 processing pin elements were checked.
- These are source-concordance checks. An internal estimate or source assertion is not thereby independently verified as an official statistic, current processor capacity, pesticide approval or regulatory rule.

## Confirmed defects and prepared fixes

| Finding | Before | Prepared correction |
|---|---|---|
| Wrong processing state | 16 pin elements across 13 node contexts in 11 crops | Every pin is contained in a state listed by its own source node |
| Different node targets overlap | 23 near-identical coordinate stacks across 19 crops, plus close overlaps | Separate node targets by at least 18 SVG pixels; preserve source jurisdiction |
| Variety/product/grade used as belt title | 116 field-crop cards across 24 crops | Exact source geography first; variety/trade label separate; other source geographies explicitly counted and available in the drawer |
| Variety used as season/system | 40 rows in six crops | Read the actual season/system/class column; keep literal source text |
| Existing lint formatting error | A formatting error in beltEvidence | Formatting-only correction |

The pin bug moved **every circle sharing a coordinate**, including circles for a different node. Both existing preparation scripts now restrict movement to the same node colour. A shared final containment/collision pass prevents the error returning.

Pins remain **indicative state positions**, never verified district centres or facility coordinates. No point is presented as a newly geocoded plant.

All 120 path-geometry fingerprints remain unchanged. The source SVG pointers, their source hashes, official production observations, quantities and district APY observations are preserved. 64 application copies change: 24 national panels and 40 processing panels. Some processing copies only gain explicit pin-state metadata.

### Wrong-state processing contexts

| Crop | Source node | Pin appeared in | Source jurisdiction |
|---|---|---|---|
| Apple | The Kashipur–Rudrapur–Pantnagar Foothill Corridor (Uttarakhand) | HP | UK |
| Cotton | Saurashtra–Kadi Ginning & Export Mega-Cluster (Gujarat) | TN | GJ |
| Cotton | Vidarbha–Marathwada Black-Soil Aggregation Corridor (Maharashtra) | TN | MH |
| Gram | Indore–Malwa Processing & Kabuli Export Hub (Madhya Pradesh) | RJ | MP |
| Guarseed | Jodhpur–Bikaner Industrial Super-Cluster (Rajasthan) | HR | RJ |
| Lentil | Bundelkhand–Kanpur Processing Corridor (Uttar Pradesh) | MP | UP |
| Niger Seeds | Navsari–Mumbai Export Processing Corridor (Gujarat & Maharashtra) | MP | GJ / MH |
| Pigeon Pea | Latur–Akola Dal Milling Super-Cluster (Maharashtra) | KA | MH |
| Ragi | Old Mysore Commercial & Malting Corridor (Southern Karnataka) | TN | KA |
| Safflower | Solapur–Barshi Processing Super-Cluster (Maharashtra) | KA | MH |
| Soybean | Indore–Dewas Solvent Extraction Super-Cluster (Madhya Pradesh) | GJ | MP |
| Soybean | Latur–Nagpur Industrial Processing Corridor (Maharashtra) | GJ | MH |
| Wheat | Malwa–Central Value-Addition & Durum Processing Hub (Madhya Pradesh) | KA | MP |

### Calendar corrections

| Crop | Corrected rows |
|---|---|
| Jute & Mesta | 6 |
| Tobacco | 7 |
| Sunflower | 6 |
| Sesamum | 8 |
| Safflower | 6 |
| Niger Seeds | 7 |

The corrected fields are written to both the combined build snapshot and the six browser-loaded crop files. The generator is fixed as well, so a later rebuild does not restore the defect.

## Items deliberately left for source/editorial review

These are review cases, not permission to delete source-backed locations or infer new facts. The full JSON register includes each relevant source quote and record ID.

- **R01 · Capsicum** — Hooghly & Birbhum — MH / WB  Split the named WB belt from the separately listed Ahmednagar/Nashik MH origin. Retain both source locations; do not delete Hooghly/Birbhum.
- **R02 · Grapes** — Nashik Belt — KA / MH  Do not attach every state in a cultivar row to the single named Nashik belt. Review each source-origin bullet independently.
- **R03 · Guava** — Prayagraj & Kaushambi — BR / UP  Keep the named belt separate from other origins for the same variety.
- **R04 · Litchi** — Muzaffarpur Belt — BR / JH  Review the badge at the named-belt scope, not the entire cultivar-distribution scope.
- **R05 · Papaya** — Rayalaseema Corridor — AP / GJ / MP  Separate the named AP belt from the other regional origins of the same hybrid.
- **R06 · Pomegranate** — Solapur & Sangli — GJ / KA / MH  Review the named district belt independently of other Bhagwa origins.
- **R07 · Niger Seeds** —  Export terminals/processing facilities and Koraput/Mandla sourcing are different roles. The patch uses a neutral commercial-source-geography label. Do not call every location a growing belt, or call Nyjer a cultivar.
- **R08 · All 40** — 37 legacy source shapes, 36 LGD identities; Dadar & Nagar Haveli and Daman & Diu shapes lack a data-action binding  Choose an explicit current-identity binding policy for the retained historic shapes. Do not redraw maps or aggregate historical production observations silently.
- **R09 · Capsicum / other rows with shorthand geography** —  Source includes Kashmir Valley (J&K), but stateCodes currently contains only HP. The text parser misses this shorthand. Repair aliases with source-backed current/historical identity rules.
- **R10 · All 40** —  Map snapshot production and selected-year official records are different layers. Niger has no independent production rows in the cached dataset, yet the original map has numeric historical/archive values. Keep exact source/period/status visible before changing rankings or colours. Capsicum’s original 2024–25 map lists 22 mapped state/UT values, while the cached independent table contains only three 2024–25 rows, classified as advance estimates. The map values need their own source/status audit; missing table rows are not zero.
- **R11 · Niger Seeds / Cotton / Apple / Papaya** — Niger ranked-state label is cut at Dadar & Nagar Have; Cotton source-period caption spills beyond the ranked panel; Apple processing variety block crowds PRIMARY PRODUCTS; Papaya has a literal ellipsis in a belt heading  Use full wrapping or an explicit source-record control in these exact text regions. Preserve quantities and geography. These broader layout repairs are not applied by this patch.
- **R12 · Source drawer policy** —  isPublicSource currently accepts any HTTPS host except three Google host families. This is a denylist, not the approved-public-publications allowlist specified in the clean-up plan. Drawer-link tests alone do not establish that every remaining host is approved.
- **R13 · Niger Seeds** — Cuscuta / Dodder is grouped under Pests  Review whether the content model needs a separate parasitic-weed category. The source target and impact text are retained; this patch makes no new management or regulatory claim.

The original 16 horticulture cohorts retain their current curated belt headings. Their **83 source belt rows** are included in the JSON review register. In particular, state badges must refer to the named belt rather than all states where its cultivar occurs. Multi-state cultivar distribution, processing-node state, catchment, port and growing belt require distinct objects.

## Completeness inventory for all 40 crops

Rows below describe cached evidence, not universal data completeness. “Missing” is never zero. A Production Context value remains an estimate; the record count below is not a verified production total.

| Crop | Independent production rows / newest year | District APY rows | Calendar / belt / node / protection rows | National belt display |
|---|---|---|---|---|
| Mango | 291 / 2024-25 | 38 | 25 / 6 / 4 / 6 | Scope review |
| Banana | 292 / 2024-25 | 38 | 18 / 5 / 4 / 6 | Scope review |
| Oranges | 222 / 2024-25 | 38 | 12 / 5 / 3 / 6 | Scope review |
| Guava | 270 / 2024-25 | 38 | 11 / 5 / 3 / 6 | Scope review |
| Grapes | 145 / 2024-25 | 38 | 11 / 5 / 3 / 6 | Scope review |
| Papaya | 239 / 2023-24 | Missing | 12 / 5 / 4 / 6 | Scope review |
| Pineapple | 170 / 2024-25 | 38 | 11 / 4 / 3 / 6 | Scope review |
| Pomegranate | 158 / 2023-24 | Missing | 8 / 5 / 3 / 6 | Scope review |
| Apple | 75 / 2023-24 | Missing | 13 / 5 / 3 / 6 | Scope review |
| Litchi | 46 / 2015-16 | Missing | 12 / 6 / 3 / 6 | Scope review |
| Sapota | 166 / 2023-24 | Missing | 11 / 6 / 3 / 6 | Scope review |
| Jackfruit | 48 / 2024-25 | 38 | 8 / 6 / 4 / 6 | Scope review |
| Potato | 286 / 2024-25 | 38 | 13 / 5 / 3 / 6 | Scope review |
| Onion | 282 / 2024-25 | 68 | 14 / 5 / 3 / 6 | Scope review |
| Tomato | 301 / 2024-25 | 38 | 9 / 5 / 3 / 6 | Scope review |
| Capsicum | 210 / 2024-25 | Missing | 10 / 5 / 4 / 6 | Scope review |
| Rice | 60 / 2024-25 | 38 | 17 / 6 / 3 / 6 | Corrected |
| Wheat | 56 / 2024-25 | Missing | 11 / 5 / 3 / 6 | Corrected |
| Jowar | 56 / 2024-25 | 38 | 11 / 5 / 3 / 6 | Corrected |
| Bajra | 54 / 2024-25 | 38 | 11 / 5 / 3 / 6 | Corrected |
| Barley | 1 / 2021-22 | Missing | 10 / 5 / 3 / 6 | Corrected |
| Ragi | 1 / 2024-25 | 38 | 10 / 5 / 3 / 2 | Corrected |
| Small Millets | Missing | Missing | 10 / 6 / 3 / 6 | Corrected |
| Gram | 60 / 2024-25 | 38 | 10 / 5 / 3 / 6 | Corrected |
| Pigeon Pea | 56 / 2024-25 | 38 | 8 / 5 / 3 / 6 | Corrected |
| Black Gram | 1 / 2024-25 | 38 | 10 / 5 / 3 / 6 | Corrected |
| Moong | 1 / 2024-25 | 38 | 10 / 5 / 3 / 6 | Corrected |
| Lentil | 50 / 2024-25 | Missing | 10 / 5 / 3 / 6 | Corrected |
| Cotton | 56 / 2024-25 | Missing | 9 / 6 / 3 / 6 | Corrected |
| Jute & Mesta | 30 / 2024-25 | Missing | 6 / 4 / 3 / 6 | Corrected |
| Tobacco | 52 / 2024-25 | Missing | 7 / 5 / 3 / 6 | Corrected |
| Guarseed | Missing | Missing | 6 / 5 / 3 / 6 | Corrected |
| Groundnut | 54 / 2024-25 | Missing | 10 / 5 / 3 / 6 | Corrected |
| Rapeseed & Mustard | 56 / 2024-25 | Missing | 10 / 5 / 3 / 6 | Corrected |
| Soybean | 51 / 2024-25 | Missing | 8 / 5 / 3 / 6 | Corrected |
| Sunflower | 45 / 2024-25 | Missing | 6 / 3 / 3 / 6 | Corrected |
| Sesamum | Missing | Missing | 8 / 4 / 3 / 6 | Corrected |
| Safflower | Missing | Missing | 6 / 3 / 3 / 6 | Corrected |
| Castor | Missing | Missing | 6 / 5 / 3 / 6 | Corrected |
| Niger Seeds | Missing | Missing | 7 / 4 / 3 / 6 | Corrected |

Six crops have no independent production rows in the cached source table: Small Millets, Guarseed, Sesamum, Safflower, Castor and Niger Seeds. Their numeric original map snapshots must not be silently promoted into current independent-government observations. Litchi’s newest cached independent year is 2015–16. The six-system correction does not add any missing official records.

## Validation

- Seven new Python regression tests pass: source-column selection, runtime/build consistency, all 120 geometry and application hashes, all 205 pin-state memberships, all 116 sourced belt headings, colour-isolated relocation and rerun idempotency.
- All 30 existing application tests pass with `npm test -- --testTimeout=30000 --maxWorkers=1`. The first concurrent run hit the existing five-second limit in the two large SVG scans; there was no failed data assertion.
- TypeScript check and production build pass.
- Lint passes with seven existing React Fast Refresh warnings; its pre-existing formatting error is corrected.
- A read-only rerun reports zero further image/data/pin changes and checks all 120 geometries.
- Static SVG renders were visually inspected for Cotton, Niger Seeds, Wheat, Rice, Apple, Mango and Capsicum. This is not a browser desktop/mobile acceptance test; the local browser executable was unavailable.

## What this package does not close

The delivery-page completeness UI, published-site loading measurements, logo/entry compression, build-time sanitisation, manual state-belt scope review, current-identity handling of the two unbound legacy UT shapes and the remaining text-overflow repairs remain open. This patch does not claim to finish the entire Lovable clean-up plan.

## Applying the package

Read `APPLY_IN_LOVABLE.md` in the archive. The guarded installer checks each destination file against its baseline or prepared hash and refuses to overwrite divergent work. Simply uploading this ZIP into the GitHub root does not apply its contents. Apply it to the existing codebase, run the included checks, inspect the Lovable preview, and publish separately when ready.
