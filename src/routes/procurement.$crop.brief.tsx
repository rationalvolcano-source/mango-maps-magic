import { createFileRoute } from "@tanstack/react-router";
import { SourcingBriefPage } from "@/components/gramshakti/procurement-details";
import { pageHead, selectionSearch } from "@/lib/gramshakti/data";

export const Route = createFileRoute("/procurement/$crop/brief")({
  validateSearch: selectionSearch,
  head: ({ params }) =>
    pageHead(
      `${params.crop} sourcing brief`,
      "Source-backed candidate origins and processing context.",
    ),
  component: Page,
});
function Page() {
  const { crop } = Route.useParams();
  return <SourcingBriefPage crop={crop} />;
}
