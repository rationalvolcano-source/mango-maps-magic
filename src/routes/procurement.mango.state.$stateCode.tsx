import { createFileRoute } from "@tanstack/react-router";
import { stateName } from "@/lib/gramshakti/procurement";
import { StateAssetPage } from "@/components/gramshakti/asset-viewer";
import { pageHead, selectionSearch } from "@/lib/gramshakti/data";
export const Route = createFileRoute("/procurement/mango/state/$stateCode")({
  validateSearch: selectionSearch,
  head: ({ params }) =>
    pageHead(
      `Mango in ${stateName(params.stateCode) ?? params.stateCode}`,
      "State production, district evidence and Mango sourcing context.",
    ),
  component: StateDetail,
});
function StateDetail() {
  const { stateCode } = Route.useParams();
  return <StateAssetPage crop="mango" stateCode={stateCode} />;
}
