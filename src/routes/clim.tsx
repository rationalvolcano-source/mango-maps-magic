import { createFileRoute } from "@tanstack/react-router";
import { FuturePage } from "@/components/gramshakti/entry";
import { pageHead, selectionSearch } from "@/lib/gramshakti/data";
export const Route = createFileRoute("/clim")({
  validateSearch: selectionSearch,
  head: () =>
    pageHead("CLIM Climate Analysis", "Future agricultural intelligence module from GramShakti."),
  component: FutureModule,
});
function FutureModule() {
  return <FuturePage climate={true} />;
}
