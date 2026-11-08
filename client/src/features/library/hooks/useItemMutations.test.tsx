import { useQueryClient } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it } from "vite-plus/test";
import { Providers } from "../../../app/providers.tsx";
import { me, mkItem } from "../../../test/fixtures.ts";
import { server } from "../../../test/server.ts";
import type { Item } from "../types.ts";
import { ITEMS } from "./useItems.ts";
import { useItemMutations } from "./useItemMutations.ts";

const wrapper = ({ children }: { children: ReactNode }) => <Providers>{children}</Providers>;

describe("useItemMutations.update", () => {
  it("rolls back only the item that failed", async () => {
    server.use(
      http.get("/api/auth/me", () => HttpResponse.json({ user: me })),
      http.patch("/api/items/:id", async ({ params, request }) => {
        if (params.id === "a") {
          await delay(30);
          return HttpResponse.json({ error: { message: "Nope" } }, { status: 500 });
        }
        return HttpResponse.json({ item: mkItem("b", { ...((await request.json()) as object) }) });
      }),
    );
    const { result } = renderHook(() => ({ m: useItemMutations(), qc: useQueryClient() }), {
      wrapper,
    });
    act(() => {
      result.current.qc.setQueryData(ITEMS, [mkItem("a"), mkItem("b")]);
    });

    await act(async () => {
      await Promise.allSettled([
        result.current.m.update("a", { fav: true }),
        result.current.m.update("b", { fav: true }),
      ]);
    });

    const items = result.current.qc.getQueryData<Item[]>(ITEMS)!;
    expect(items.find((i) => i.id === "a")!.fav).toBe(false);
    expect(items.find((i) => i.id === "b")!.fav).toBe(true);
  });
});
