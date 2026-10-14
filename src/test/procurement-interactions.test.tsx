import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import {
  DetailedProcurement,
  StateProcurementPage,
  SourcingBriefPage,
} from "@/components/gramshakti/procurement-details";
import { EvidenceProvider, SelectionControls } from "@/components/gramshakti/shared";
import { isCropSlug } from "@/lib/gramshakti/assets";
import { selectionSearch } from "@/lib/gramshakti/data";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

async function open(url: string) {
  const root = createRootRoute({
    validateSearch: selectionSearch,
    component: () => (
      <EvidenceProvider>
        <SelectionControls />
        <Outlet />
      </EvidenceProvider>
    ),
  });
  const sourcing = createRoute({
    getParentRoute: () => root,
    path: "/procurement/$crop",
    component: () => {
      const { crop } = sourcing.useParams();
      return isCropSlug(crop) ? (
        <DetailedProcurement crop={crop} screen="002" />
      ) : (
        <p>Crop unavailable</p>
      );
    },
  });
  const state = createRoute({
    getParentRoute: () => root,
    path: "/procurement/$crop/state/$stateCode",
    component: () => {
      const { crop, stateCode } = state.useParams();
      return <StateProcurementPage crop={crop} stateCode={stateCode} />;
    },
  });
  const brief = createRoute({
    getParentRoute: () => root,
    path: "/procurement/$crop/brief",
    component: () => {
      const { crop } = brief.useParams();
      return <SourcingBriefPage crop={crop} />;
    },
  });
  const processing = createRoute({
    getParentRoute: () => root,
    path: "/procurement/$crop/processing",
    component: () => {
      const { crop } = processing.useParams();
      return isCropSlug(crop) ? (
        <DetailedProcurement crop={crop} screen="006" />
      ) : (
        <p>Unavailable</p>
      );
    },
  });
  const router = createRouter({
    routeTree: root.addChildren([sourcing, state, brief, processing]),
    history: createMemoryHistory({ initialEntries: [url] }),
  });
  await act(async () => {
    await router.load();
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe("Procurement buyer interactions", () => {
  it("changes candidate availability when the target month changes and preserves intent", async () => {
    const router = await open("/procurement/capsicum?purpose=fresh&month=January&year=2024-25");
    expect(await screen.findByRole("row", { name: /West Bengal Indra/ })).toBeVisible();
    fireEvent.change(screen.getByLabelText("Target month"), { target: { value: "July" } });
    await waitFor(() =>
      expect(screen.queryByRole("row", { name: /West Bengal Indra/ })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("row", { name: /Himachal Pradesh Solan/ })).toBeVisible();
    expect(router.state.location.search).toMatchObject({
      purpose: "fresh",
      month: "July",
      year: "2024-25",
    });
    fireEvent.click(screen.getByRole("button", { name: "Processed" }));
    expect(
      await screen.findByRole("heading", { name: "Relevant processing context" }),
    ).toBeVisible();
  });
  it("opens the exact clicked Capsicum source rather than every crop passage", async () => {
    await open("/procurement/capsicum?purpose=fresh&month=January");
    const row = await screen.findByRole("row", { name: /West Bengal Indra/ });
    fireEvent.click(within(row).getByRole("button", { name: "Source" }));
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: /Capsicum · West Bengal · Indra/ }),
    ).toBeVisible();
    expect(within(dialog).getByText(/December – March \(Peak winter flush\)/)).toBeVisible();
    expect(within(dialog).queryByText(/Karnataka.*Round the year/)).not.toBeInTheDocument();
  });
  it("creates a reloadable brief with the chosen source record and honest production gaps", async () => {
    const router = await open("/procurement/capsicum?purpose=fresh&month=January&year=2024-25");
    const row = await screen.findByRole("row", { name: /West Bengal Indra/ });
    fireEvent.click(within(row).getByRole("button", { name: /Add candidate/ }));
    fireEvent.click((await screen.findAllByRole("link", { name: /Sourcing brief \(1\)/ }))[0]!);
    expect(await screen.findByRole("heading", { name: "Capsicum · Fresh sourcing" })).toBeVisible();
    expect(
      screen.getByText("No exact official production record supplied.", { exact: false }),
    ).toBeVisible();
    const url = router.state.location.href;
    expect(url).toContain("items=capsicum-calendar");
    cleanup();
    await open(url);
    expect(await screen.findByRole("heading", { name: /West Bengal · Indra/ })).toBeVisible();
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Print / Save PDF" }));
    expect(print).toHaveBeenCalledOnce();
  });
  it("shows compact district APY, historical years and estimates as separate evidence", async () => {
    await open("/procurement/mango/state/TN?purpose=processed&month=June&year=2024-25");
    expect(await screen.findByRole("heading", { name: "Mango · Tamil Nadu" })).toBeVisible();
    const row = screen.getByRole("row", { name: /Ariyalur 2024-25/ });
    expect(within(row).getByText("522")).toBeVisible();
    expect(within(row).getByText("3,054")).toBeVisible();
    expect(within(row).getByText("5,855")).toBeVisible();
    expect(screen.getByRole("button", { name: "Show all 38 district records" })).toBeVisible();
    expect(screen.getByLabelText("2018-19: missing record")).toBeVisible();
    fireEvent.click(within(row).getByRole("button", { name: "Source" }));
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Mango · Ariyalur · 2024-25" }),
    ).toBeVisible();
    expect(
      within(dialog).getByText(/Area page: 33; production page: 11; yield page: 10/),
    ).toBeVisible();
  });
  it("makes estimated district belts usable when official district APY is missing", async () => {
    await open("/procurement/mango/state/AP?purpose=processed&month=June&year=2024-25");
    expect(await screen.findByRole("heading", { name: "Mango · Andhra Pradesh" })).toBeVisible();
    expect(
      screen.getByText(
        "No official district APY is supplied for this crop/state. Relevant source estimates appear separately below.",
      ),
    ).toBeVisible();
    expect(screen.getByText(/Chittoor & Tirupati Belt \(~32–36%/)).toBeVisible();
    expect(screen.getAllByText("Source estimate").length).toBeGreaterThan(0);
  });
  it("shows the recovered historical Onion district tranche with its actual year", async () => {
    await open("/procurement/onion/state/KA?purpose=fresh&year=2024-25");
    expect(await screen.findByRole("heading", { name: "Onion · Karnataka" })).toBeVisible();
    expect(screen.getByText("30 supplied records")).toBeVisible();
    fireEvent.change(screen.getByLabelText("District reporting year"), {
      target: { value: "2021-22" },
    });
    expect(screen.getByRole("row", { name: /BAGALKOTE 2021-22/ })).toBeVisible();
  });
});
