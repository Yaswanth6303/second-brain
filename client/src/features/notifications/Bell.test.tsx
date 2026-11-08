import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vite-plus/test";
import { me } from "../../test/fixtures.ts";
import { renderApp } from "../../test/render.tsx";
import { server } from "../../test/server.ts";

describe("notifications bell", () => {
  it("shows a dot until opened, then marks everything seen", async () => {
    let unseen = true;
    server.use(
      http.get("/api/auth/me", () => HttpResponse.json({ user: me })),
      http.get("/api/items", () => HttpResponse.json({ items: [] })),
      http.get("/api/notifications", () =>
        HttpResponse.json({
          unseen,
          items: [
            {
              kind: "inbox",
              at: new Date().toISOString(),
              text: "Priya Nair sent you The essence of calculus",
              link: "/inbox",
            },
          ],
        }),
      ),
      http.post("/api/notifications/seen", () => {
        unseen = false;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderApp("/library");
    const user = userEvent.setup();
    const bell = await screen.findByRole("button", { name: "Notifications, new" });
    await user.click(bell);
    expect(
      await screen.findByText("Priya Nair sent you The essence of calculus"),
    ).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Notifications" })).toBeInTheDocument();
  });
});
