import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vite-plus/test";
import { renderApp } from "../../../test/render.tsx";
import { server } from "../../../test/server.ts";

const unauthenticated = http.get("/api/auth/me", () =>
  HttpResponse.json({ error: { message: "Log in to continue." } }, { status: 401 }),
);

async function fillSignup() {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText("Full name"), "Aarav Mehta");
  await user.type(screen.getByLabelText("Username"), "aarav");
  await user.type(screen.getByLabelText("Email"), "aarav@example.com");
  await user.type(screen.getByLabelText("Password"), "Secret123!");
  return user;
}

describe("SignupPage", () => {
  it("requires agreeing to the terms", async () => {
    server.use(unauthenticated);
    renderApp("/signup");
    const user = await fillSignup();
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(
      await screen.findByText("You need to agree before you can sign up."),
    ).toBeInTheDocument();
  });

  it("shows server field errors next to the field", async () => {
    server.use(
      unauthenticated,
      http.post("/api/auth/signup", () =>
        HttpResponse.json(
          { error: { message: "Already taken.", fields: { handle: "Already taken." } } },
          { status: 409 },
        ),
      ),
    );
    renderApp("/signup");
    const user = await fillSignup();
    await user.click(screen.getByLabelText("I agree to the terms and the privacy policy"));
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Already taken.")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toHaveAttribute("aria-invalid", "true");
  });
});
