import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vite-plus/test";
import { me } from "../../test/fixtures.ts";
import { renderApp } from "../../test/render.tsx";
import { server } from "../../test/server.ts";

const loggedIn = http.get("/api/auth/me", () => HttpResponse.json({ user: me }));

describe("AppShell", () => {
  it("shows the rail with Library as the current page", async () => {
    server.use(loggedIn);
    renderApp("/library");
    const nav = await screen.findByRole("navigation", { name: "Main" });
    for (const name of ["Library", "Shared with me", "Friends", "Groups", "Profile"]) {
      expect(within(nav).getByRole("link", { name })).toBeInTheDocument();
    }
    expect(within(nav).getByRole("link", { name: "Library" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("logs out from the account menu and lands on login", async () => {
    let loggedOut = false;
    server.use(
      http.get("/api/auth/me", () =>
        loggedOut
          ? HttpResponse.json({ error: { message: "x" } }, { status: 401 })
          : HttpResponse.json({ user: me }),
      ),
      http.post("/api/auth/logout", () => {
        loggedOut = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { router } = renderApp("/library");
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Account menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Log out" }));
    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(loggedOut).toBe(true);
    expect(router.state.location.pathname).toBe("/login");
  });

  it("toggles the theme", async () => {
    server.use(loggedIn);
    renderApp("/library");
    const user = userEvent.setup();
    const before = document.documentElement.dataset.theme;
    await user.click(await screen.findByRole("button", { name: "Switch between light and dark" }));
    expect(document.documentElement.dataset.theme).not.toBe(before);
  });
});
