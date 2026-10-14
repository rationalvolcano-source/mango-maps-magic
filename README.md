# Mango Maps Magic

Create a NEW project named GramShakti.
Implement the welcome experience and complete Mango Procurement journey in one bounded build pass.
Use the existing visual compositions to build functional pages with the interactions below.

1. Visual assets and their exact roles
Reference | Exact asset | Use
V0 | GramShakti_Logo_Concept_01.png | Actual logo on welcome, objective selection and every application header. Preserve proportions and transparency.
V1 | SH-001_Objective_Selection_v1.png | Welcome atmosphere and objective-selection composition. The reference has TWO cards; implement THREE matching cards by adding CLIM.
V2 | PR-001_Crop_Intent_58_Crop_Universe_v1.png | Procurement crop directory: eight category panels, search, Fresh/Processed toggle and optional target-month control.
V3 | PR-002_Mango_National_Sourcing_Landscape_FINAL.png | Mango national page: availability ribbon; ranked states / India map / commercial belts; lower protection preview and statewise seasonality table.
V4 | PR-003_Mango_Pesticide_Pressure_Detail_FINAL.png | Card grid, regional accents and typography for the redesigned protection page. Replace the pressure content as specified below.
V5 | PR-006_Mango_Processing_Geographies_FINAL.png | Processing page: upper summary band, map on the left, processing-cluster cards on the right. Apply the quantitative and geography corrections below.

PR-005 State Detail has no dedicated reference identified in this asset list. Design it as a continuation of V3, reusing its header, cards, colours, map legend and table styling.
Render headings, values, tables, cards, controls and narrative as responsive components. V0 is an actual image asset; the other full-screen compositions guide the functional layouts.

Preserve the shared visual language:
Warm cream/pale green backgrounds.
Deep green headings and primary actions.
Leaf-green active states.
Saffron/orange emphasis.
Rounded white cards, fine borders and restrained shadows.
V1’s frosted panel treatment for entry screens.
V2–V5’s cleaner cards inside Procurement.
Extract colours from the references into shared design tokens.

2. Build and navigation sequence
Implement in this order:
Welcome → Objective selection → Crop directory → Mango national page → State Detail → Processing page → Protection page → shared source drawer and responsive verification.

User action -> Result:
- Welcome: Enter GramShakti -> Open /choose.
- Objective selection: Procurement -> Open /procurement.
- Objective selection: Opportunity / FPO Discovery -> Open /opportunity, an explanatory future-module shell.
- Objective selection: CLIM — Climate Analysis -> Open /clim, an explanatory future-module shell.
- Directory: click Mango -> Open /procurement/mango, preserving purpose and optional month.
- Directory: Change objective -> Return to /choose.
- National map: click a state -> Open /procurement/mango/state/:stateCode.
- Ranked-state list or seasonality table: click a state name -> Open the same State Detail route.
- Commercial belt: expand -> Reveal its full varieties, geography and source context on the current page.
- National page: Processing Geographies -> Open /procurement/mango/processing.
- National page: View crop protection detail -> Open /procurement/mango/crop-protection.
- Processing map: click a cluster marker -> Select and focus its matching cluster card.
- Processing card: View details -> Expand its product, catchment, variety and source information; highlight its marker.
- Any evidence label or source icon -> Open the record-specific source drawer.
- Any Mango subpage: Back to sourcing landscape -> Return to /procurement/mango with selection state preserved.

3. Welcome page — /
Use V0 for the logo and V1 for the illustrated agricultural India atmosphere.
Place the logo at the upper left with generous clear space. In the main frosted panel show:
Eyebrow: GramShakti Intelligence
Heading: Explore India’s agricultural landscape.
Supporting line: Evidence-led sourcing, opportunity and climate intelligence.
One prominent deep-green button: Enter GramShakti, using V1’s saffron accent treatment.
Clicking the button opens /choose.

4. Objective selection — /choose
Recreate V1’s large frosted central panel, green heading, saffron divider, white rounded cards, icon circles and circular arrow controls.
Heading: What would you like to do?
Supporting line: Choose how you want to explore India’s agricultural landscape.
Modify TWO cards -> THREE equally sized cards:
Card 1 — Procurement: crate/leaf icon style. Copy: "Explore sourcing geographies, seasonal availability, varieties and processing contexts." CTA: "Explore procurement". Clicking either opens /procurement.
Card 2 — Opportunity / FPO Discovery: map/pin/growth icon style. Copy: "Explore future crop-cluster and FPO intelligence." Status chip: "In development". Click opens /opportunity.
Card 3 — CLIM — Climate Analysis: matching sun/cloud/thermometer icon using the SAME green/saffron palette, circular icon background, card corner radius, text hierarchy, padding and spacing, circular arrow button. Copy: "Explore future crop-stage climate and soil intelligence." Status chip: "In development". Click opens /clim.
Widen the central panel for a three-column desktop row; stack cards on narrow screens. Opportunity and CLIM clicks open styled explanatory pages with a Back to objectives button.

5. Crop directory — /procurement
Retain the heading: "What do you want to procure?"
Recreate V2’s eight category panels:
- Cereals & Millets
- Pulses
- Commercial & Fibre
- Oilseeds
- Fruits
- Vegetables & Tubers
- Plantation & Nuts
- Spices & Condiments
Canonical 58 crops:
Search filters the visible crop buttons.
Fresh/Processed toggle and target month controls: Default purpose: Fresh. Target month: optional. Preserve both across navigation.
Clicking Mango opens its national page for either purpose.
Other crops show "Not yet implemented" modal/state.
The five documented blocked crops—Maize, Sugarcane, Green Chillies, Tapioca and Arecanut—open an in-directory "Source repair required" modal with the specific reason from the correction register.

6. Mango national landscape — /procurement/mango
Header and availability ribbon:
Logo, breadcrumb, title "Mango • India supply landscape", purpose, target month, reporting period (2024–25 default), Sources action.
Horizontal January–December ribbon populated from Mango seasonality records (peak, secondary/lean, not evidenced).
Left column — Ranked state production:
Ranked horizontal bars from verified government state-production table. Rows show state name, production (tonnes), unit, reporting period. Clicking state name/bar opens State Detail.
Centre column — India production map:
Choropleth, production legend, white map card. Clicking a state opens State Detail. Fallback to interactive state grid/table navigation if polygon geometry is unavailable. Missing production is neutral grey and distinct from verified zero.
Right column — Commercial mango belts:
Load Mango belts: belt name, geography, explicitly linked varieties. Expanding reveals commercial traits, destination context, exact source. Bottom action: Processing Geographies -> opens /procurement/mango/processing.
Lower left — Crop protection context:
Preview of 3–5 sourced pests/diseases: name, regional relevance, timing, supported management mode chips (Cultural, Mechanical, Biological, Chemical, Regulatory). CTA: "View crop protection detail" opens /procurement/mango/crop-protection.
Lower right — Statewise mango availability:
State x January–December table from seasonality records. Month-cell click reveals underlying records in drawer. State-name click opens State Detail. Target month highlights column.

7. State Detail — /procurement/mango/state/:stateCode
Header: logo, breadcrumb, selected state and reporting-period chip.
Official state production headline. State availability and varieties.
Read-only district evidence table (District, Year/season, Area and unit, Production and unit, Yield and unit, Evidence status, Source).
Tamil Nadu has 38 official district records; other states show honest missing-data states or separately attributed Production Context estimates.
Expandable commercial-belt and related processing/protection context.
Processing and protection buttons open respective Mango pages.

8. Processing geographies — /procurement/mango/processing
Upper summary band with crosswalk coverage counts and documented product/process summaries.
Map on left, 4 cluster cards on right: Chittoor (AP), Krishnagiri–Dharmapuri (TN), Konkan Coast (MH), Saurashtra & South Gujarat (GJ).
Node jurisdiction and catchments in separate labelled sections.
Cluster name, node jurisdiction, products/processes, catchment geographies, source-linked infrastructure context, key varieties, source action.
Clicking marker selects/focuses card; clicking card highlights marker and expands details.

9. Crop protection — /procurement/mango/crop-protection
Title: "Mango • regional pest and management context".
State/zone filters and All / Pests / Diseases selector.
One card per target (hopper, fruit fly, anthracnose, powdery mildew, malformation, bacterial canker): common name, scientific name, geography, commercial impact, supported timing, management categories (Cultural/prevention, Mechanical/monitoring, Biological, Chemical context, Regulatory context).
Suppress raw pesticide doses, spray schedules, PHIs and unvalidated regulatory claims.
Bottom disclaimer: "Source-based crop protection context; not an outbreak forecast or pesticide prescription."

10. Shared source drawer:
Every evidence action opens the record-specific source drawer showing title, tab/row or exact passage, source link, reporting period, native/display unit, evidence class, transformation, caveat.

11. Important interpretation:
- State production is already normalized to tonnes. Do not multiply it by 1,000 again.
- State area/yield are not supplied by the primary production table.
- District evidence covers Tamil Nadu only; other states retain honest missing-data states or separately attributed Production Context.
- Historical state data lacks 2018–19. Do not interpolate it.
- Responsive verification across 375, 768 and 1440 pixels.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://mango-maps-magic.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e999a8a8-6944-4e6b-9f7f-c96fc57c1d3e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
