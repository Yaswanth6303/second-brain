import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it } from "vite-plus/test";
import { renderApp } from "../../../test/render.tsx";
import { server } from "../../../test/server.ts";

describe("ForgotPage", () => {
  it("sends one request even when the button is clicked twice", async () => {
    let calls = 0;
    server.use(
      http.get("/api/auth/me", () =>
        HttpResponse.json({ error: { message: "x" } }, { status: 401 }),
      ),
      http.post("/api/auth/forgot", async () => {
        calls++;
        await delay(50);
        return HttpResponse.json({ ok: true });
      }),
    );
    renderApp("/forgot");
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Email"), "aarav@example.com");
    const button = screen.getByRole("button", { name: "Send reset link" });
    await user.dblClick(button);
    expect(await screen.findByText(/a reset link is on its way/)).toBeInTheDocument();
    expect(calls).toBe(1);
  });
});
