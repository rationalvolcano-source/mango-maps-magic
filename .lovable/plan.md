# GramShakti: evidence clean-up, source lockdown, clickable highlights, 40-crop content model and faster loading

## 1. Lock down internal sources (first priority)
- Remove every "Open source" and download link that points to Crosswalks, Production Context or internal workbooks/docs.
- Internal sources show a short note instead: "Internal source, summarised in this evidence record". The rest of the information stays: source type, reporting period, units, transformation and caveat.
- Links stay only for approved public publications (for example official government production pages).
- Add a test that fails if any drawer link points to an internal document.

## 2. Replace placeholder passages
- Remove automatic text like "Cross Walks-2.0.docx · body block 4881 · table 138 · row 2" from what users see.
- Show the actual readable content instead: geography, impact and management context, with a clean citation label (for example "GramShakti crop crosswalk, Mango protection section").
- Where no readable passage exists, say so plainly instead of showing a document address.
- Internal location details stay in the data for checking, but are not displayed.

## 3. Clearer clickable elements (original artwork unchanged)
- Same gentle treatment everywhere: pointer cursor, soft green outline or tint on hover, saffron outline when selected, clear keyboard focus ring.
- Applies to state shapes, ranked-state names, protection cards, processing pins and cards, the crop directory, month and season cells, and drawer buttons.
- Only highlight overlays are added; the pictures themselves are not redrawn.

## 4. Fix belts that are really variety names
- Check every "belt" entry for all 40 crops. Real growing regions stay as belts. Variety or cultivar names move to a Varieties field.
- Start with Cotton, Niger Seeds and Wheat, then the remaining crops.
- Where the original picture shows a variety name in a belt card, change only that small text area, following the existing correction method.
- Unclear entries are marked "Belt not identified in source". Nothing is guessed.

## 5. Standard information set for all 40 crops
Every crop page uses the same sections, and each section is either filled from a verified source or clearly marked missing:
crop and purpose/month context · official production · labelled Production Context estimates · availability windows · varieties · commercial belts · state and district evidence · processing locations · protection context · evidence quality and caveats.
- A completeness table for each crop (on the delivery page) shows what is verified, missing or awaiting a source.

## 6. Much faster loading
- Load only the data for the open crop, not the full data for all 40 crops at once.
- Load each artwork only when its page opens, cache it in the browser, and preload the likely next page (for example processing from the national page).
- Prepare cleaned artwork ahead of time instead of cleaning it in the browser on every visit, while keeping the original files untouched and checked.
- Compress large artwork and logo files, and load the entry picture first.
- Measure load times before and after for the welcome page, the directory, Mango and Rice, and report both.

## 7. Checks and release
- Run tests, lint, type checks and build. Check the source drawer for Rice, Niger Seeds, Cotton, Wheat, Mango and Capsicum on desktop and mobile, and confirm no internal document opens or downloads.
- Sync to GitHub. Publishing stays with you.

## Technical notes
- The drawer (shared.tsx) gets a source visibility setting: public, internal or missing. Only public sources show a link. The internal list covers the crosswalk document, Production Context, the crosswalk spreadsheet and the district/state workbooks unless approved.
- Remove locator text from the visible passage. Keep locator data in the records for audits.
- Split procurement-records, official-records, source-records and exact-crosswalk JSON into one file per crop and load it with dynamic import in route loaders through ensureQueryData.
- Clean the SVGs during the build script and save sanitised application copies. DOMPurify stays only as a safety fallback. Cache fetched SVG text with the query client and preload it on link intent.
- Add CSS highlight styles for [data-action]: hover, :focus-visible and [aria-selected].
- Write the belt/variety split to a new correction file with source references, applied by the existing artwork preparation scripts.
