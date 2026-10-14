<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## GramShakti architecture
- Procurement, legacy Mango and dynamic crop parent routes render Outlet; content belongs to index leaves so nested sourcing journeys render independently.
- Procurement purpose and optional target month are validated URL search parameters and preserved by internal links so back-navigation retains intent.
- Evidence is opened through a shared record-specific drawer; missing source datasets must remain explicitly missing, never converted into fabricated numbers, seasonality or verified claims.
- Shared GramShakti page components live under src/components/gramshakti and browser-safe evidence definitions under src/lib/gramshakti so routes stay thin and presentation is consistent.

- Original artwork uses one cached crop manifest and a sanitized inline SVG viewer; original state paths and card/pin elements carry accessible data-action bindings so visual geometry is never recreated.
- Keep immutable and edited asset pointers separately, with per-crop source manifests and matching SHA checks, so source preservation can be audited.

- Source workbook exports are pre-extracted into browser-safe exact-row records with row/page provenance; detail pages use original normalized units and never aggregate district values into state figures.
