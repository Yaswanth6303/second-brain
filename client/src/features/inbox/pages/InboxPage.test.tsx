import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vite-plus/test";
import { me, mkItem, priya } from "../../../test/fixtures.ts";
import { renderApp } from "../../../test/render.tsx";
import { server } from "../../../test/server.ts";

const entry = {
  id: "e1",
  shareId: "s1",
  from: priya,
  group: null,
  url: "https://www.youtube.com/watch?v=WUvTyaaNkzM",
  title: "The essence of calculus",
  type: "video",
  mins: 17,
  msg: "Watch this first.",
  at: new Date().toISOString(),
  state: "new",
};

function setup() {
  const calls: string[] = [];
  let state = "new";
  server.use(
    http.get("/api/auth/me", () => HttpResponse.json({ user: me })),
    http.get("/api/items", () => HttpResponse.json({ items: [] })),
    http.get("/api/inbox", () =>
      HttpResponse.json({ entries: state === "dismissed" ? [] : [{ ...entry, state }] }),
    ),
    http.post("/api/shares/s1/save", () => {
      calls.push("save");
      state = "saved";
      return HttpResponse.json({ item: mkItem("i9", { title: entry.title }) });
    }),
    http.post("/api/inbox/e1/dismiss", () => {
      calls.push("dismiss");
      state = "dismissed";
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return { ...renderApp("/inbox"), user: userEvent.setup(), calls };
}

describe("InboxPage", () => {
  it("shows who sent what, and saves it to the library", async () => {
    const { user, calls } = setup();
    expect(await screen.findByText("1 new link from friends and groups.")).toBeInTheDocument();
    const row = (await screen.findByRole("link", { name: entry.title })).closest("li")!;
    expect(within(row).getByText("Watch this first.")).toBeInTheDocument();
    await user.click(within(row).getByRole("button", { name: "Save to library" }));
    expect(await screen.findByText("Saved to your library")).toBeInTheDocument();
    expect(calls).toEqual(["save"]);
    expect(await within(row).findByText("In your library")).toBeInTheDocument();
  });

  it("dismisses", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: "Dismiss" }));
    expect(await screen.findByText("Dismissed")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Nothing waiting" })).toBeInTheDocument(),
    );
  });
});
