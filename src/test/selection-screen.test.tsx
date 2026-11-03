import { QueryClient } from "@tanstack/react-query";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ChoosePage } from "@/components/gramshakti/entry";
import { routeTree } from "@/routeTree.gen";
import { selectionSearch } from "@/lib/gramshakti/data";

afterEach(() => {
  cleanup();
});

async function openChoose() {
  const root = createRootRoute({ validateSearch: selectionSearch });
  const choose = createRoute({
    getParentRoute: () => root,
    path: "/choose",
    component: ChoosePage,
  });
  const procurement = createRoute({
    getParentRoute: () => root,
    path: "/procurement",
    component: () => <p>Procurement workspace</p>,
  });
  const router = createRouter({
    routeTree: root.addChildren([choose, procurement]),
    history: createMemoryHistory({ initialEntries: ["/choose"] }),
  });
  await act(async () => {
    await router.load();
  });
  render(<RouterProvider router={router} />);
  return router;
}

describe("Objective selection screen", () => {
  it("keeps the Version 1 card linked to the existing procurement view", async () => {
    const router = await openChoose();
    const card = screen.getByRole("link", { name: /Procurement Intelligence Dashboard/ });
    expect(card).toHaveAttribute("href", expect.stringContaining("/procurement"));
    fireEvent.click(card);
    await waitFor(() => expect(router.state.location.pathname).toBe("/procurement"));
  });

  it("marks the Version 2 card under construction and never navigates from it", async () => {
    const router = await openChoose();
    const card = document.querySelector<HTMLElement>(".source-objective-soon");
    expect(card).not.toBeNull();
    expect(card).toHaveTextContent("Under construction");
    expect(card).toHaveTextContent("A guided procurement reporting and FPO qualification experience.");
    expect(card?.querySelector("a,button")).toBeNull();
    fireEvent.click(card!);
    expect(router.state.location.pathname).toBe("/choose");
  });

  it("still matches the opportunity and clim routes the screen no longer offers", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    for (const path of ["/opportunity", "/clim"]) {
      expect(router.matchRoutes(path).at(-1)?.routeId).not.toBe("__root__");
    }
  });
});
