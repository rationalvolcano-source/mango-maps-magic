import { createFileRoute, Outlet } from "@tanstack/react-router";
import { loadCropData } from "@/lib/gramshakti/crop-data";
export const Route = createFileRoute("/procurement/$crop")({
  loader: async ({ params }) => {
    await loadCropData(params.crop);
  },
  component: Outlet,
});
