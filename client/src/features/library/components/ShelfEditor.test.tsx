import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vite-plus/test";
import { me, mkItem } from "../../../test/fixtures.ts";
import { renderWithProviders } from "../../../test/render.tsx";
import { server } from "../../../test/server.ts";
import { useAuth } from "../../auth/index.ts";
import { typeDefs } from "../types.ts";
import { Shelf } from "./Shelf.tsx";
import { ShelfEditor } from "./ShelfEditor.tsx";

const items = [
  mkItem("a", { title: "Fav one", fav: true, savedAt: "2026-11-01T00:00:00.000Z" }),
  mkItem("b", { title: "Plain", savedAt: "2026-11-02T00:00:00.000Z" }),
  mkItem("c", { title: "Fav two", fav: true, status: "done", savedAt: "2026-11-03T00:00:00.000Z" }),
];

describe("ShelfEditor", () => {
  it("adds all favourites and saves the order", async () => {
    let saved: unknown;
    server.use(
      http.get("/api/auth/me", () => HttpResponse.json({ user: me })),
      http.get("/api/items", () => HttpResponse.json({ items })),
      http.put("/api/users/me/shelf", async ({ request }) => {
        saved = await request.json();
        return HttpResponse.json(saved as { ids: string[] });
      }),
    );
    renderWithProviders(
      <LoggedIn>
        <ShelfEditor onClose={() => {}} />
      </LoggedIn>,
    );
    const user = userEvent.setup();
    const dialog = await screen.findByRole("dialog", { name: "Choose what is on your shelf" });
    await within(dialog).findByText("Plain");
    await user.click(within(dialog).getByRole("button", { name: /Add all favourites/ }));
    await user.click(within(dialog).getByRole("button", { name: "Move Fav one right" }));
    await user.click(within(dialog).getByRole("button", { name: "Save shelf" }));
    await waitFor(() => expect(saved).toEqual({ ids: ["c", "a"] }));
    expect(await screen.findByText("2 links on your shelf")).toBeInTheDocument();
  });
});

describe("ShelfEditor while the library loads", () => {
  it("cannot save, so it never empties the shelf", async () => {
    let puts = 0;
    server.use(
      http.get("/api/auth/me", () => HttpResponse.json({ user: { ...me, shelf: ["a"] } })),
      http.get("/api/items", async () => {
        await delay(300);
        return HttpResponse.json({ items });
      }),
      http.put("/api/users/me/shelf", () => {
        puts++;
        return HttpResponse.json({ shelf: [] });
      }),
    );
    renderWithProviders(
      <LoggedIn>
        <ShelfEditor onClose={() => {}} />
      </LoggedIn>,
    );
    const dialog = await screen.findByRole("dialog", { name: "Choose what is on your shelf" });
    const save = within(dialog).getByRole("button", { name: "Save shelf" });
    expect(save).toBeDisabled();
    await userEvent.setup().click(save);
    expect(puts).toBe(0);
  });
});

describe("Shelf", () => {
  it("draws one labelled spine per link, with a legend", () => {
    renderWithProviders(<Shelf items={items} defs={typeDefs([])} />);
    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(
      screen.getByRole("link", { name: "Fav two · Article · 10 min · Finished" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Finished")).toBeInTheDocument();
  });
});

// In the app the editor only opens for a logged-in user; wait for that here too.
function LoggedIn({ children }: { children: React.ReactNode }) {
  return useAuth().user ? children : null;
}
