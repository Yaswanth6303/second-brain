import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vite-plus/test";
import { me, mkItem } from "../../../test/fixtures.ts";
import { renderApp } from "../../../test/render.tsx";
import { server } from "../../../test/server.ts";

const items = [
  mkItem("v1", {
    type: "video",
    title: "Neural networks",
    url: "https://www.youtube.com/watch?v=aircAruvnKk",
  }),
  mkItem("a1", { title: "How to Do Great Work", coll: "Career", tags: ["career"] }),
  mkItem("a2", { title: "Attention Is All You Need", tags: ["ai"] }),
];

function setup(path = "/library") {
  const patches: unknown[] = [];
  server.use(
    http.get("/api/auth/me", () => HttpResponse.json({ user: me })),
    http.get("/api/items", () => HttpResponse.json({ items })),
    http.patch("/api/items/:id", async ({ params, request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      patches.push({ id: params.id, ...body });
      return HttpResponse.json({ item: { ...items.find((i) => i.id === params.id), ...body } });
    }),
  );
  return { ...renderApp(path), user: userEvent.setup(), patches };
}

const filterBar = () => screen.getByRole("group", { name: "Filter by type" });
const links = () => within(screen.getByRole("region", { name: "Links" }));
const loaded = () =>
  screen
    .findByRole("region", { name: "Links" })
    .then(() => links().findByRole("link", { name: "Neural networks" }));

describe("LibraryPage", () => {
  it("shows every link with type counts", async () => {
    setup();
    expect(await loaded()).toBeInTheDocument();
    expect(within(filterBar()).getByRole("button", { name: /All\s*3/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(filterBar()).getByRole("button", { name: /Articles\s*2/ })).toBeInTheDocument();
    expect(within(filterBar()).getByRole("button", { name: /Videos\s*1/ })).toBeInTheDocument();
  });

  it("filters by type and keeps it in the address", async () => {
    const { router, user } = setup();
    await loaded();
    await user.click(within(filterBar()).getByRole("button", { name: /Videos/ }));
    expect(links().queryByRole("link", { name: "How to Do Great Work" })).not.toBeInTheDocument();
    expect(router.state.location.search).toBe("?type=video");
  });

  it("moves a link to in progress", async () => {
    const { user, patches } = setup();
    const card = (await loaded()).closest("article")!;
    await user.click(within(card).getByRole("button", { name: /In queue/ }));
    await waitFor(() => expect(patches).toEqual([{ id: "v1", status: "progress" }]));
    expect(await screen.findByText("Marked as in progress")).toBeInTheDocument();
  });

  it("warns when a pasted link is already saved", async () => {
    const { user } = setup();
    await user.type(
      await screen.findByLabelText("Paste a link"),
      "youtube.com/watch?v=aircAruvnKk",
    );
    expect(await screen.findByText("Already in your library:")).toBeInTheDocument();
  });

  it("says when nothing matches", async () => {
    setup("/library?q=zzz");
    expect(await screen.findByRole("heading", { name: "Nothing matches" })).toBeInTheDocument();
  });

  it("filters by a collection from the rail", async () => {
    const { user } = setup();
    await loaded();
    const rail = screen.getByRole("navigation", { name: "Collections" });
    await user.click(within(rail).getByRole("link", { name: /Career/ }));
    expect(links().getByRole("link", { name: "How to Do Great Work" })).toBeInTheDocument();
    expect(links().queryByRole("link", { name: "Neural networks" })).not.toBeInTheDocument();
  });
});
