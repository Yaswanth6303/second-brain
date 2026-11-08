import type { Item, ItemStatus } from "../types.ts";

export type Sort = "new" | "old" | "short" | "az";

export type Filters = {
  type: string;
  status: "all" | ItemStatus;
  tag: string | null;
  coll: string | null;
  q: string;
  fav: boolean;
  shelf: boolean;
  sort: Sort;
};

export const DEFAULT_FILTERS: Filters = {
  type: "all",
  status: "all",
  tag: null,
  coll: null,
  q: "",
  fav: false,
  shelf: false,
  sort: "new",
};

const SORTS: Record<Sort, (a: Item, b: Item) => number> = {
  new: (a, b) => b.savedAt.localeCompare(a.savedAt),
  old: (a, b) => a.savedAt.localeCompare(b.savedAt),
  short: (a, b) => (a.mins || 1e9) - (b.mins || 1e9),
  az: (a, b) => a.title.localeCompare(b.title),
};

export function filterItems(items: Item[], f: Filters, shelf: string[]): Item[] {
  const q = f.q.trim().toLowerCase();
  return items
    .filter(
      (i) =>
        (f.type === "all" || i.type === f.type) &&
        (f.status === "all" || i.status === f.status) &&
        (!f.tag || i.tags.includes(f.tag)) &&
        (!f.coll || i.coll === f.coll) &&
        (!f.fav || i.fav) &&
        (!f.shelf || shelf.includes(i.id)) &&
        (!q || [i.title, i.note, i.url, i.coll, ...i.tags].join(" ").toLowerCase().includes(q)),
    )
    .sort(SORTS[f.sort]);
}

export function tagCounts(items: Item[]): [string, number][] {
  const m: Record<string, number> = {};
  for (const i of items) for (const t of i.tags) m[t] = (m[t] ?? 0) + 1;
  return Object.entries(m).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

const DAY = 86400e3;
export const isDust = (i: Item, now = Date.now()) =>
  i.status === "queue" && now - Date.parse(i.savedAt) > 30 * DAY;

// Budget 0 means "any length".
export const pickPool = (items: Item[], budget: number) =>
  items.filter((i) => i.status !== "done" && i.mins && (!budget || i.mins <= budget));
