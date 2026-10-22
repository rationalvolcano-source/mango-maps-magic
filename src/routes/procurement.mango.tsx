import { createFileRoute, Outlet } from "@tanstack/react-router";
import { loadCropData, primeCropData } from "@/lib/gramshakti/crop-data";
export const Route = createFileRoute("/procurement/mango")({
  loader: () => loadCropData("mango"),
  component: MangoLayout,
});
function MangoLayout() {
  primeCropData("mango", Route.useLoaderData());
  return <Outlet />;
}
