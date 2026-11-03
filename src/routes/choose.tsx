import { createFileRoute } from "@tanstack/react-router";
import { ChoosePage } from "@/components/gramshakti/entry";
import { pageHead, selectionSearch } from "@/lib/gramshakti/data";
export const Route = createFileRoute("/choose")({
  validateSearch: selectionSearch,
  head: () =>
    pageHead(
      "Choose your objective",
      "Open the Procurement Intelligence Dashboard, or see what is coming in GramShakti AI.",
    ),
  component: ChoosePage,
});
