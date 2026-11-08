import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vite-plus/test";
import { server } from "../test/server.ts";
import { ApiError, api } from "./api-client.ts";

describe("api", () => {
  it("returns parsed JSON", async () => {
    server.use(http.get("/api/thing", () => HttpResponse.json({ a: 1 })));
    await expect(api("/thing")).resolves.toEqual({ a: 1 });
  });

  it("returns undefined for 204", async () => {
    server.use(http.post("/api/out", () => new HttpResponse(null, { status: 204 })));
    await expect(api("/out", { method: "POST" })).resolves.toBeUndefined();
  });

  it("throws ApiError with status and fields", async () => {
    server.use(
      http.post("/api/signup", () =>
        HttpResponse.json(
          { error: { message: "Already taken.", fields: { email: "Already taken." } } },
          { status: 409 },
        ),
      ),
    );
    const err = await api("/signup", { method: "POST", body: {} }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({
      status: 409,
      message: "Already taken.",
      fields: { email: "Already taken." },
    });
  });
});
