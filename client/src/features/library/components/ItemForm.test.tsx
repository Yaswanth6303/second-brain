import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vite-plus/test";
import { me, mkItem } from "../../../test/fixtures.ts";
import { renderWithProviders } from "../../../test/render.tsx";
import { server } from "../../../test/server.ts";
import { ItemFormProvider, useItemForm } from "./ItemFormProvider.tsx";

function Harness({ preUrl }: { preUrl?: string }) {
  const form = useItemForm();
  const item = mkItem("i1", { title: "Old title" });
  return (
    <>
      <button onClick={() => form.openNew(preUrl)}>new</button>
      <button onClick={() => form.confirmDelete(item)}>delete</button>
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
    <ItemFormProvider>
      <Harness preUrl={preUrl} />
    </ItemFormProvider>,
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
