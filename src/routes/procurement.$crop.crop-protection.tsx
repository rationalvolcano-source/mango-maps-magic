import { createFileRoute } from "@tanstack/react-router";
import { CropArtworkPage } from "@/components/gramshakti/asset-viewer";
import { pageHead, selectionSearch } from "@/lib/gramshakti/data";
export const Route = createFileRoute("/procurement/$crop/crop-protection")({
  validateSearch: selectionSearch,
  head: ({ params }) =>
    pageHead(
      `${params.crop} crop protection context`,
      "Regional pest and disease source geography and descriptive management context.",
    ),
  component: Page,
});
function Page() {
  const { crop } = Route.useParams();
  return <CropArtworkPage crop={crop} screen="003" />;
}
