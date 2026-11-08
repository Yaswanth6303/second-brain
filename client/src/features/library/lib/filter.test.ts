import { describe, expect, it } from "vite-plus/test";
import type { Item } from "../types.ts";
import { DEFAULT_FILTERS, filterItems, isDust, pickPool, tagCounts } from "./filter.ts";

const mk = (id: string, o: Partial<Item> = {}): Item => ({
  id,
  url: `https://x.com/${id}`,
  title: id,
  type: "article",
  tags: [],
  mins: 10,
  status: "queue",
  fav: false,
  note: "",
  coll: "",
  remindAt: null,
  savedAt: "2026-11-01T00:00:00.000Z",
  ...o,
});

const items = [
  mk("b", { type: "video", tags: ["ai"], mins: 0, savedAt: "2026-11-03T00:00:00.000Z" }),
  mk("a", { tags: ["ai", "math"], note: "Neural nets", fav: true, mins: 30 }),
  mk("c", { status: "done", coll: "Career", savedAt: "2026-11-02T00:00:00.000Z", mins: 5 }),
];
const ids = (l: Item[]) => l.map((i) => i.id);

describe("filterItems", () => {
  it("defaults to newest first", () => {
    expect(ids(filterItems(items, DEFAULT_FILTERS, []))).toEqual(["b", "c", "a"]);
  });

  it("filters by type, tag, status, collection, favourites and shelf", () => {
    const f = DEFAULT_FILTERS;
    expect(ids(filterItems(items, { ...f, type: "video" }, []))).toEqual(["b"]);
    expect(ids(filterItems(items, { ...f, tag: "math" }, []))).toEqual(["a"]);
    expect(ids(filterItems(items, { ...f, status: "done" }, []))).toEqual(["c"]);
    expect(ids(filterItems(items, { ...f, coll: "Career" }, []))).toEqual(["c"]);
    expect(ids(filterItems(items, { ...f, fav: true }, []))).toEqual(["a"]);
    expect(ids(filterItems(items, { ...f, shelf: true }, ["c"]))).toEqual(["c"]);
  });

  it("searches name, note, link and tags", () => {
    expect(ids(filterItems(items, { ...DEFAULT_FILTERS, q: "NEURAL" }, []))).toEqual(["a"]);
    expect(ids(filterItems(items, { ...DEFAULT_FILTERS, q: "x.com/c" }, []))).toEqual(["c"]);
  });

  it("sorts oldest, shortest (unknown length last) and A to Z", () => {
    expect(ids(filterItems(items, { ...DEFAULT_FILTERS, sort: "old" }, []))).toEqual([
      "a",
      "c",
      "b",
    ]);
    expect(ids(filterItems(items, { ...DEFAULT_FILTERS, sort: "short" }, []))).toEqual([
      "c",
      "a",
      "b",
    ]);
    expect(ids(filterItems(items, { ...DEFAULT_FILTERS, sort: "az" }, []))).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});

describe("library helpers", () => {
  it("counts tags, most used first then A to Z", () => {
    expect(tagCounts(items)).toEqual([
      ["ai", 2],
      ["math", 1],
    ]);
  });

  it("flags queued links older than 30 days as dust", () => {
    const now = Date.parse("2026-12-15T00:00:00Z");
    expect(isDust(mk("x"), now)).toBe(true);
    expect(isDust(mk("y", { status: "progress" }), now)).toBe(false);
    expect(isDust(mk("z", { savedAt: "2026-12-01T00:00:00.000Z" }), now)).toBe(false);
  });

  it("picks from unfinished links with a length that fits the budget", () => {
    expect(ids(pickPool(items, 15))).toEqual([]);
    expect(ids(pickPool(items, 30))).toEqual(["a"]);
    expect(ids(pickPool(items, 0))).toEqual(["a"]);
  });
});
