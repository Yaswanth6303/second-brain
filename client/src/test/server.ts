import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

// Empty social data by default, since the rail and bell load it on every page.
// Tests add their own handlers with server.use(...), which take precedence.
export const server = setupServer(
  http.get("/api/inbox", () => HttpResponse.json({ entries: [] })),
  http.get("/api/friends", () => HttpResponse.json({ friends: [], requests: [], sent: [] })),
  http.get("/api/groups", () => HttpResponse.json({ groups: [] })),
  http.get("/api/shares/sent", () => HttpResponse.json({ shares: [] })),
  http.get("/api/notifications", () => HttpResponse.json({ items: [], unseen: false })),
);
