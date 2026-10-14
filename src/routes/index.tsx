import { createFileRoute } from "@tanstack/react-router";
import { WelcomePage } from "@/components/gramshakti/entry";
import { pageHead, selectionSearch } from "@/lib/gramshakti/data";
export const Route = createFileRoute("/")({
  validateSearch: selectionSearch,
  head: () =>
    pageHead(
      "Welcome to GramShakti",
      "Evidence-led sourcing, opportunity and climate intelligence for India.",
    ),
  component: WelcomePage,
});
