import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vite-plus/test";
import { me, priya, rohan } from "../../../test/fixtures.ts";
import { renderApp } from "../../../test/render.tsx";
import { server } from "../../../test/server.ts";

function setup() {
  let accepted = false;
  server.use(
    http.get("/api/auth/me", () => HttpResponse.json({ user: me })),
    http.get("/api/items", () => HttpResponse.json({ items: [] })),
    http.get("/api/friends", () =>
      HttpResponse.json({
        friends: [
          { user: priya, since: "2026-01-01T00:00:00.000Z", sent: 4, done: 3, received: 2 },
          ...(accepted
            ? [{ user: rohan, since: new Date().toISOString(), sent: 0, done: 0, received: 0 }]
            : []),
        ],
        requests: accepted ? [] : [{ id: "req1", user: rohan }],
        sent: [],
      }),
    ),
    http.post("/api/friends/requests/req1/accept", () => {
      accepted = true;
      return HttpResponse.json({ friend: true, user: rohan });
    }),
    http.post("/api/friends/requests", () =>
      HttpResponse.json(
        { error: { message: "No one with that username or email." } },
        { status: 404 },
      ),
    ),
  );
  return { ...renderApp("/friends"), user: userEvent.setup() };
}

describe("FriendsPage", () => {
  it("shows friends with their watchlist progress", async () => {
    setup();
    const card = (await screen.findByText("Priya Nair")).closest("article")!;
    expect(within(card).getByText("Finished 3 of 4 links on their watchlist")).toBeInTheDocument();
    expect(within(card).getByText("Sent you 2 links")).toBeInTheDocument();
  });

  it("accepts a request", async () => {
    const { user } = setup();
    expect(await screen.findByText("@rohan wants to share links with you")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Accept" }));
    expect(await screen.findByText("Rohan Verma is now a friend")).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: "Open watchlist for Rohan Verma" }),
    ).toBeInTheDocument();
  });

  it("shows why a request could not be sent", async () => {
    const { user } = setup();
    await user.click(await screen.findByRole("button", { name: /Add friend/ }));
    await user.type(screen.getByLabelText("Username or email"), "@nobody");
    await user.click(screen.getByRole("button", { name: "Send request" }));
    expect(await screen.findByText("No one with that username or email.")).toBeInTheDocument();
  });
});
