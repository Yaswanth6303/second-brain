import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vite-plus/test";
import { me, mkItem, priya } from "../../../test/fixtures.ts";
import { renderWithProviders } from "../../../test/render.tsx";
import { server } from "../../../test/server.ts";
import { SharesProvider } from "../../shares/index.ts";
import { ItemFormProvider, useItemForm } from "./ItemFormProvider.tsx";

function Harness({ preUrl }: { preUrl?: string }) {
  const form = useItemForm();
  const item = mkItem("i1", { title: "Old title" });
  return (
    <>
      <button onClick={() => form.openNew(preUrl)}>new</button>
      <button onClick={() => form.confirmDelete(item)}>delete</button>
      <button onClick={() => form.openEdit(item)}>edit</button>
    </>
  );
}

function setup(preUrl?: string) {
  const posted: unknown[] = [];
  server.use(
    http.get("/api/auth/me", () => HttpResponse.json({ user: me })),
    http.get("/api/items", () => HttpResponse.json({ items: [] })),
    http.post("/api/users/me/collections", async ({ request }) => {
      const { name } = (await request.json()) as { name: string };
      posted.push({ collection: name });
      return HttpResponse.json({ name, collections: [...me.collections, name] });
    }),
    http.post("/api/items", async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      posted.push({ item: body });
      return HttpResponse.json({ item: mkItem("new", body) }, { status: 201 });
    }),
  );
  renderWithProviders(
    <SharesProvider>
      <ItemFormProvider>
        <Harness preUrl={preUrl} />
      </ItemFormProvider>
    </SharesProvider>,
  );
  return { user: userEvent.setup(), posted };
}

describe("ItemForm", () => {
  it("prefills type and name from a pasted link", async () => {
    const { user } = setup("https://www.youtube.com/watch/how-neural-networks-learn");
    await user.click(await screen.findByText("new"));
    expect(await screen.findByRole("heading", { name: "Save a link" })).toBeInTheDocument();
    expect(screen.getByLabelText("Type")).toHaveValue("video");
    expect(screen.getByLabelText("Name")).toHaveValue("How neural networks learn");
  });

  it("asks for a name", async () => {
    const { user } = setup("https://example.com/x");
    await user.click(await screen.findByText("new"));
    await user.click(await screen.findByRole("button", { name: "Save to library" }));
    expect(await screen.findByText("Give this link a name.")).toBeInTheDocument();
  });

  it("creates a new collection, then saves the link in it with its tags", async () => {
    const { user, posted } = setup("https://example.com/great-work-essay");
    await user.click(await screen.findByText("new"));
    await user.selectOptions(await screen.findByLabelText("Collection"), "__new");
    await user.type(screen.getByLabelText("Name your collection"), "Weekend reads");
    const tagInput = screen.getByLabelText("Tags");
    await user.type(tagInput, "Essays{Enter}drop me{Enter}");
    await user.type(tagInput, "{Backspace}");
    await user.click(screen.getByRole("button", { name: "Save to library" }));
    await waitFor(() => expect(posted).toHaveLength(2));
    expect(posted[0]).toEqual({ collection: "Weekend reads" });
    expect(posted[1]).toMatchObject({
      item: { coll: "Weekend reads", tags: ["essays"], title: "Great work essay" },
    });
    expect(await screen.findByText("Saved to your library")).toBeInTheDocument();
  });

  it("puts a new link on a friend's watchlist", async () => {
    const { user, posted } = setup("https://example.com/great-work-essay");
    server.use(
      http.get("/api/friends", () =>
        HttpResponse.json({
          friends: [{ user: priya, since: "2026-01-01", sent: 0, done: 0, received: 0 }],
          requests: [],
          sent: [],
        }),
      ),
      http.post("/api/shares", async ({ request }) => {
        posted.push({ shares: await request.json() });
        return HttpResponse.json({ shares: [] }, { status: 201 });
      }),
    );
    await user.click(await screen.findByText("new"));
    await user.click(await screen.findByRole("checkbox", { name: /Priya Nair/ }));
    await user.click(screen.getByRole("button", { name: "Save to library" }));
    expect(await screen.findByText("Saved and added to 1 watchlist")).toBeInTheDocument();
    expect(posted[1]).toEqual({
      shares: { itemIds: ["new"], friends: ["p1"], groups: [], handles: [], msg: "" },
    });
  });

  it("editing before shares have loaded never unshares anything", async () => {
    const { user, posted } = setup();
    const deleted: string[] = [];
    server.use(
      http.get("/api/shares/sent", async () => {
        await delay(60);
        return HttpResponse.json({
          shares: [
            {
              id: "s1",
              item: "i1",
              title: "Old title",
              kind: "friend",
              to: priya,
              seen: "new",
              seenAt: null,
              done: [],
              react: "",
              at: "2026-11-01",
            },
          ],
        });
      }),
      http.delete("/api/shares/:id", ({ params }) => {
        deleted.push(String(params.id));
        return new HttpResponse(null, { status: 204 });
      }),
      http.patch("/api/items/i1", async ({ request }) =>
        HttpResponse.json({ item: mkItem("i1", (await request.json()) as object) }),
      ),
    );
    await user.click(await screen.findByText("edit"));
    await screen.findByRole("heading", { name: "Edit link" });
    await new Promise((r) => setTimeout(r, 120));
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Changes saved")).toBeInTheDocument();
    expect(deleted).toEqual([]);
    void posted;
  });

  it("lists people the link was shared with by username, so they can be unticked", async () => {
    const { user } = setup();
    const zed = { id: "z1", name: "Zed Stranger", handle: "zed", bio: "", hue: 300 };
    server.use(
      http.get("/api/shares/sent", () =>
        HttpResponse.json({
          shares: [
            {
              id: "s9",
              item: "i1",
              title: "Old title",
              kind: "friend",
              to: zed,
              seen: "new",
              seenAt: null,
              done: [],
              react: "",
              at: "2026-11-01",
            },
          ],
        }),
      ),
    );
    await user.click(await screen.findByText("edit"));
    expect(await screen.findByRole("checkbox", { name: /Zed Stranger/ })).toBeChecked();
  });

  it("retrying after a failed share updates the link instead of saving it twice", async () => {
    const { user, posted } = setup("https://example.com/great-work-essay");
    let shareCalls = 0;
    const patched: string[] = [];
    server.use(
      http.get("/api/friends", () =>
        HttpResponse.json({
          friends: [{ user: priya, since: "2026-01-01", sent: 0, done: 0, received: 0 }],
          requests: [],
          sent: [],
        }),
      ),
      http.post("/api/shares", () =>
        ++shareCalls === 1
          ? HttpResponse.json({ error: { message: "Try again" } }, { status: 500 })
          : HttpResponse.json({ shares: [] }, { status: 201 }),
      ),
      http.patch("/api/items/:id", async ({ params, request }) => {
        patched.push(String(params.id));
        return HttpResponse.json({
          item: mkItem(String(params.id), (await request.json()) as object),
        });
      }),
    );
    await user.click(await screen.findByText("new"));
    await user.click(await screen.findByRole("checkbox", { name: /Priya Nair/ }));
    await user.click(screen.getByRole("button", { name: "Save to library" }));
    expect(await screen.findByText("Try again")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save to library" }));
    expect(await screen.findByText("Saved and added to 1 watchlist")).toBeInTheDocument();
    expect(posted.filter((p) => "item" in (p as object))).toHaveLength(1);
    expect(patched).toEqual(["new"]);
  });

  it("deletes after confirming", async () => {
    let deleted = "";
    const { user } = setup();
    server.use(
      http.delete("/api/items/:id", ({ params }) => {
        deleted = String(params.id);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await user.click(await screen.findByText("delete"));
    expect(await screen.findByText(/"Old title" leaves your library/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete link" }));
    expect(await screen.findByText("Link deleted")).toBeInTheDocument();
    expect(deleted).toBe("i1");
  });
});
