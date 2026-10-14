import { createFileRoute } from "@tanstack/react-router";
import { CropArtworkPage } from "@/components/gramshakti/asset-viewer";
import { pageHead, selectionSearch } from "@/lib/gramshakti/data";
export const Route = createFileRoute("/procurement/mango/processing")({
  validateSearch: selectionSearch,
  head: () =>
    pageHead(
      "Mango processing geographies",
      "Explore Mango processing clusters, products and catchment contexts.",
    ),
  component: () => <CropArtworkPage crop="mango" screen="006" />,
});
