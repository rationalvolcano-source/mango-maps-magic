import { createFileRoute, Outlet } from "@tanstack/react-router";
import { loadCropData } from "@/lib/gramshakti/crop-data";
export const Route = createFileRoute("/procurement/mango")({
  loader: async () => {
    await loadCropData("mango");
  },
  component: Outlet,
});
