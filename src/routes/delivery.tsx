import { createFileRoute, Link } from "@tanstack/react-router";
import { pageHead } from "@/lib/gramshakti/data";
import { cropAssets } from "@/lib/gramshakti/assets";
import corrections from "@/lib/gramshakti/applied-corrections.json";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/delivery")({
  head: () =>
    pageHead(
      "Artwork delivery report",
      "GramShakti asset-to-route mapping, applied corrections and precise remaining dependencies.",
    ),
  component: Report,
});
function Report() {
  return (
    <main className="page-container">
      <h1>GramShakti · Artwork delivery</h1>
      <Button asChild className="my-5">
        <Link to="/procurement">Open original crop directory</Link>
      </Button>
      <h2>Asset-to-route mapping</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Crop</th>
              <th>PR-002</th>
              <th>PR-003</th>
              <th>PR-006</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(cropAssets).map(([crop, a]) => (
              <tr key={crop}>
                <td>{a.name}</td>
                <td>
                  <Link to="/procurement/$crop" params={{ crop }}>
                    Sourcing
                  </Link>
                </td>
                <td>
                  <Link to="/procurement/$crop/crop-protection" params={{ crop }}>
                    Protection
                  </Link>
                </td>
                <td>
                  <Link to="/procurement/$crop/processing" params={{ crop }}>
                    Processing
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="mt-8">Applied corrections</h2>
      <ul className="list-disc pl-5 space-y-2 mt-4">
        <li>
          All 48 original SVG hashes verified against matching per-crop manifests; originals
          retained separately from edited application assets.
        </li>
        <li>
          SH-001 background retained with the approved three-objective control overlay; entry now
          uses the original artwork.
        </li>
        <li>
          Original map paths, canvas proportions, card positions and production composition
          retained.
        </li>
        <li>Compiler/debug provenance moved to the source drawer.</li>
        <li>
          Unsupported pressure labels, pesticide rates, schedules, PHIs and unvalidated regulatory
          assertions suppressed.
        </li>
        <li>Processing summary totals and product-mix claims hidden rather than inferred.</li>
        {corrections.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
      <h2 className="mt-8">Remaining source/editorial work</h2>
      <ul className="list-disc pl-5 space-y-3 mt-4">
        <li>
          Original logo, SH-001 and all four native workbooks downloaded successfully. State detail
          reads exact 2024–25 official rows; absent rows stay missing. Tamil Nadu district rows
          retain native units and source pages.
        </li>
        <li>
          Remaining approved work: Potato Agra/Farrukhabad/Hooghly pin corrections; Jackfruit
          Panruti duplicate-node consolidation; Litchi Bihar-versus-Punjab/Uttarakhand cultivar
          separation; Capsicum Nadia/Karnal/Saproon/Ranchi membership and Maharashtra/Karnataka belt
          additions. Exact district geometry is not yet retrieved; no replacement geometry is drawn.
        </li>
        <li>
          Potato Kashipur–Rudrapur remains HOLD FOR SOURCE. Capsicum Hooghly–Birbhum is retained;
          removal requires an explicit editorial override.
        </li>
        <li>
          Maize, Sugarcane, Green Chillies, Tapioca and Arecanut remain source-repair blockers;
          other out-of-scope crops have honest unavailable states.
        </li>
      </ul>
      <p className="mt-8 text-sm text-muted-foreground">
        Pratyay’s Google Drive and Google Docs supplied the cached artwork and consolidated source
        passages. Ordinary navigation does not read protected Drive.
      </p>
    </main>
  );
}
