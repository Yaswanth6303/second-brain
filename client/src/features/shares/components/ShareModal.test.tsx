import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vite-plus/test";
import { me, mkItem, priya, rohan } from "../../../test/fixtures.ts";
import { renderApp } from "../../../test/render.tsx";
import { server } from "../../../test/server.ts";

const item = mkItem("i1", { title: "Great work", fromShare: "s9" });
const club = {
  id: "g1",
  name: "Club",
  desc: "",
  owner: "u1",
  members: [person0(), priya, rohan],
  links: 0,
};
function person0() {
  return { id: me.id, name: me.name, handle: me.handle, bio: "", hue: me.hue };
}

function setup({ sent = [] as unknown[] } = {}) {
  const calls: { method: string; path: string; body?: unknown }[] = [];
  server.use(
    http.get("/api/auth/me", () => HttpResponse.json({ user: me })),
    http.get("/api/items", () => HttpResponse.json({ items: [item] })),
    http.get("/api/friends", () =>
      HttpResponse.json({
        friends: [priya, rohan].map((user) => ({
          user,
          since: "2026-01-01T00:00:00.000Z",
          sent: 0,
          done: 0,
          received: 0,
        })),
        requests: [],
        sent: [],
      }),
    ),
    http.get("/api/groups", () => HttpResponse.json({ groups: [club] })),
    http.get("/api/groups/g1", () => HttpResponse.json({ group: club, watchlist: [] })),
    http.get("/api/shares/sent", () => HttpResponse.json({ shares: sent })),
    http.get("/api/inbox", () => HttpResponse.json({ entries: [] })),
    http.get("/api/notifications", () => HttpResponse.json({ items: [], unseen: false })),
    http.post("/api/shares", async ({ request }) => {
      calls.push({ method: "POST", path: "/shares", body: await request.json() });
      return HttpResponse.json({ shares: [] }, { status: 201 });
    }),
    http.delete("/api/shares/:id", ({ params }) => {
      calls.push({ method: "DELETE", path: `/shares/${String(params.id)}` });
      return new HttpResponse(null, { status: 204 });
    }),
    http.post("/api/groups", async ({ request }) => {
      calls.push({ method: "POST", path: "/groups", body: await request.json() });
      return HttpResponse.json({ group: club }, { status: 201 });
    }),
    http.patch("/api/items/i1", async ({ request }) =>
      HttpResponse.json({ item: { ...item, ...((await request.json()) as object) } }),
    ),
  );
  return { user: userEvent.setup(), calls };
}

const sharedWithPriya = {
  id: "s1",
  item: "i1",
  title: "Great work",
  kind: "friend",
  to: priya,
  seen: "new",
  seenAt: null,
  done: [],
  react: "",
  at: new Date().toISOString(),
};

describe("ShareModal", () => {
  it("sends only the difference: unticked friends are removed, new targets added", async () => {
    const { user, calls } = setup({ sent: [sharedWithPriya] });
    renderApp("/library");
    await user.click(await screen.findByRole("button", { name: "Share Great work" }));
    const dialog = await screen.findByRole("dialog", { name: "Share this link" });
    const priyaBox = await within(dialog).findByRole("checkbox", { name: /Priya Nair/ });
    expect(priyaBox).toBeChecked();
    await user.click(priyaBox);
    await user.click(within(dialog).getByRole("checkbox", { name: /Club/ }));
    await user.click(within(dialog).getByRole("button", { name: "Update sharing" }));
    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls).toContainEqual({ method: "DELETE", path: "/shares/s1" });
    expect(calls).toContainEqual({
      method: "POST",
      path: "/shares",
      body: { itemIds: ["i1"], friends: [], groups: ["g1"], handles: [], msg: "" },
    });
    expect(await screen.findByText("On 1 watchlist now")).toBeInTheDocument();
  });
});

describe("PickModal", () => {
  it("asks to pick at least one link", async () => {
    const { user, calls } = setup();
    renderApp("/friends");
    await user.click(await screen.findByRole("button", { name: "Add links to Priya's watchlist" }));
    const dialog = await screen.findByRole("dialog", { name: "Add to Priya's watchlist" });
    await user.click(within(dialog).getByRole("button", { name: "Add to watchlist" }));
    expect(await screen.findByText("Pick at least one link")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("checkbox", { name: /Great work/ }));
    await user.click(within(dialog).getByRole("button", { name: "Add to watchlist" }));
    expect(await screen.findByText("Added 1 link to Priya's watchlist")).toBeInTheDocument();
    expect(calls[0]).toMatchObject({ body: { itemIds: ["i1"], friends: ["p1"] } });
  });
});

describe("groups", () => {
  it("creating a group opens it", async () => {
    const { user, calls } = setup();
    const { router } = renderApp("/groups");
    await user.click(await screen.findByRole("button", { name: /New group/ }));
    const dialog = await screen.findByRole("dialog", { name: "New group" });
    await user.type(within(dialog).getByLabelText("Group name"), "Club");
    await user.click(within(dialog).getByRole("checkbox", { name: /Rohan Verma/ }));
    await user.click(within(dialog).getByRole("button", { name: "Create group" }));
    expect(await screen.findByText("Group created")).toBeInTheDocument();
    expect(calls[0]).toMatchObject({ body: { name: "Club", members: ["r1"] } });
    await waitFor(() => expect(router.state.location.pathname).toBe("/groups/g1"));
  });
});

describe("reactions", () => {
  it("finishing a link a friend shared asks what you thought", async () => {
    const { user } = setup();
    server.use(http.get("/api/inbox", () => HttpResponse.json({ entries: [inboxEntry(null)] })));
    renderApp("/library");
    await finishCard(user);
    expect(await screen.findByRole("dialog", { name: "What did you think?" })).toBeInTheDocument();
  });

  it("a link shared to a group does not ask", async () => {
    const { user } = setup();
    server.use(
      http.get("/api/inbox", () =>
        HttpResponse.json({ entries: [inboxEntry({ id: "g1", name: "Club" })] }),
      ),
    );
    renderApp("/library");
    await finishCard(user);
    expect(await screen.findByText("Marked as finished")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "What did you think?" })).not.toBeInTheDocument();
  });
});

function inboxEntry(group: { id: string; name: string } | null) {
  return {
    id: "e9",
    shareId: "s9",
    from: priya,
    group,
    url: item.url,
    title: item.title,
    type: "article",
    mins: 10,
    msg: "",
    at: new Date().toISOString(),
    state: "saved",
  };
}

async function finishCard(user: ReturnType<typeof userEvent.setup>) {
  const links = await screen.findByRole("region", { name: "Links" });
  const card = (await within(links).findByRole("link", { name: "Great work" })).closest("article")!;
  await user.click(within(card).getByRole("button", { name: /In queue/ }));
  await user.click(within(card).getByRole("button", { name: /In progress/ }));
}
