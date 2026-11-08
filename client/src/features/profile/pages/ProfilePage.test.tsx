import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vite-plus/test";
import { me, mkItem, priya } from "../../../test/fixtures.ts";
import { renderApp } from "../../../test/render.tsx";
import { server } from "../../../test/server.ts";

const share = (id: string, item: string) => ({
  id,
  item,
  title: `Link ${item}`,
  kind: "friend",
  to: priya,
  seen: "done",
  seenAt: "2026-11-02T00:00:00.000Z",
  done: [],
  react: "",
  at: "2026-11-01T00:00:00.000Z",
});

function setup(path: string) {
  const calls: { method: string; path: string; body?: unknown }[] = [];
  let user = { ...me };
  server.use(
    http.get("/api/auth/me", () => HttpResponse.json({ user })),
    http.get("/api/items", () =>
      HttpResponse.json({ items: [mkItem("a", { tags: ["ai"] }), mkItem("b")] }),
    ),
    http.get("/api/shares/sent", () =>
      HttpResponse.json({ shares: [share("s1", "a"), share("s2", "b")] }),
    ),
    http.patch("/api/users/me/prefs", async ({ request }) => {
      const body = (await request.json()) as object;
      calls.push({ method: "PATCH", path: "/users/me/prefs", body });
      user = { ...user, prefs: { ...user.prefs, ...body } };
      return HttpResponse.json({ user });
    }),
    http.patch("/api/users/me", () =>
      HttpResponse.json(
        { error: { message: "Already taken.", fields: { handle: "Already taken." } } },
        { status: 409 },
      ),
    ),
    http.delete("/api/shares/:id", ({ params }) => {
      calls.push({ method: "DELETE", path: `/shares/${String(params.id)}` });
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return { ...renderApp(path), user: userEvent.setup(), calls };
}

describe("ProfilePage", () => {
  it("shows the reader card and the save calendar", async () => {
    setup("/profile");
    expect(await screen.findByRole("heading", { name: "Aarav Mehta" })).toBeInTheDocument();
    expect(
      await screen.findByRole("img", {
        name: /Links saved per day over the last 6 weeks, 2 in total/,
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Saves mostly #ai. Finished 0 of 2. Shares most with Priya."),
    ).toBeInTheDocument();
  });

  it("saves a setting as soon as it changes", async () => {
    const { user, calls } = setup("/profile/settings");
    await user.selectOptions(await screen.findByLabelText("Who can send me links"), "anyone");
    expect(await screen.findByText("Setting saved")).toBeInTheDocument();
    expect(calls).toEqual([{ method: "PATCH", path: "/users/me/prefs", body: { who: "anyone" } }]);
  });

  it("shows a taken username under the field", async () => {
    const { user } = setup("/profile/settings");
    const handle = await screen.findByLabelText("Username");
    await user.clear(handle);
    await user.type(handle, "priyan");
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    expect(await screen.findByText("Already taken.")).toBeInTheDocument();
    expect(handle).toHaveAttribute("aria-invalid", "true");
  });

  it("stops sharing with someone by removing each of their shares", async () => {
    const { user, calls } = setup("/profile/shared");
    const row = (await screen.findByRole("cell", { name: /Priya Nair/ })).closest("tr")!;
    expect(within(row).getByText("2 of 2")).toBeInTheDocument();
    await user.click(within(row).getByRole("button", { name: "Stop sharing" }));
    await user.click(
      within(await screen.findByRole("dialog", { name: "Stop sharing?" })).getByRole("button", {
        name: "Stop sharing",
      }),
    );
    await waitFor(() => expect(calls.filter((c) => c.method === "DELETE")).toHaveLength(2));
    expect(await screen.findByText("Stopped sharing with Priya Nair")).toBeInTheDocument();
  });

  it("shows a message when the save fails on a field the form does not show", async () => {
    const { user } = setup("/profile/settings");
    server.use(
      http.patch("/api/users/me", () =>
        HttpResponse.json(
          { error: { message: "Check the highlighted fields.", fields: { hue: "Too big" } } },
          { status: 400 },
        ),
      ),
    );
    await user.click(await screen.findByRole("button", { name: "Save profile" }));
    expect(await screen.findByText("Check the highlighted fields.")).toBeInTheDocument();
  });

  it("shows the saved, cleaned-up values after saving", async () => {
    const { user } = setup("/profile/settings");
    server.use(
      http.patch("/api/users/me", () => HttpResponse.json({ user: { ...me, handle: "aarav.m" } })),
    );
    const handle = await screen.findByLabelText("Username");
    await user.clear(handle);
    await user.type(handle, "Aarav.M");
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    expect(await screen.findByText("Profile saved")).toBeInTheDocument();
    expect(handle).toHaveValue("aarav.m");
  });

  it("asks for the current password when the email changes", async () => {
    const { user } = setup("/profile/settings");
    let body: Record<string, unknown> = {};
    server.use(
      http.patch("/api/users/me", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ user: { ...me, email: "new@example.com" } });
      }),
    );
    expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument();
    const email = await screen.findByLabelText("Email");
    await user.clear(email);
    await user.type(email, "new@example.com");
    await user.type(await screen.findByLabelText("Current password"), "Secret123!");
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    expect(await screen.findByText("Profile saved")).toBeInTheDocument();
    expect(body).toMatchObject({ email: "new@example.com", currentPassword: "Secret123!" });
  });
});
