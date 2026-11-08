import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vite-plus/test";
import { renderApp } from "../../test/render.tsx";
import { server } from "../../test/server.ts";

describe("auth gate", () => {
  it("sends a logged-out visitor to the login page", async () => {
    server.use(
      http.get("/api/auth/me", () =>
        HttpResponse.json({ error: { message: "x" } }, { status: 401 }),
      ),
    );
    const { router } = renderApp("/library");
    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
  });
});
