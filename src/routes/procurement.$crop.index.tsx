import { createFileRoute } from "@tanstack/react-router";
import { CropArtworkPage } from "@/components/gramshakti/asset-viewer";
import { pageHead, selectionSearch } from "@/lib/gramshakti/data";
export const Route = createFileRoute("/procurement/$crop/")({
  validateSearch: selectionSearch,
  head: ({ params }) =>
    pageHead(
      `${params.crop} sourcing landscape`,
      "Original crop production, geography and seasonality artwork with source context.",
    ),
  component: Page,
});
function Page() {
  const { crop } = Route.useParams();
  return <CropArtworkPage crop={crop} />;
}
