import { createFileRoute, Outlet } from "@tanstack/react-router";
import { loadCropData, primeCropData } from "@/lib/gramshakti/crop-data";
export const Route = createFileRoute("/procurement/$crop")({
  loader: ({ params }) => loadCropData(params.crop),
  component: CropLayout,
});
function CropLayout() {
  const { crop } = Route.useParams();
  primeCropData(crop, Route.useLoaderData());
  return <Outlet />;
}
