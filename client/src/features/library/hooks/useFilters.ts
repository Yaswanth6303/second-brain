import { useSearchParams } from "react-router";
import { DEFAULT_FILTERS, type Filters, type Sort } from "../lib/filter.ts";
import type { ItemStatus } from "../types.ts";

const STATUSES = ["queue", "progress", "done"];
const SORTS = ["new", "old", "short", "az"];

// Filters live in the address, so search, rail links and reloads all agree on them.
export function useFilters(): [Filters, (patch: Partial<Filters>) => void, () => void] {
  const [sp, setSp] = useSearchParams();
  const status = sp.get("status") ?? "";
  const sort = sp.get("sort") ?? "";
  const f: Filters = {
    type: sp.get("type") || "all",
    status: STATUSES.includes(status) ? (status as ItemStatus) : "all",
    tag: sp.get("tag"),
    coll: sp.get("coll"),
    q: sp.get("q") ?? "",
    fav: sp.get("fav") === "1",
    shelf: sp.get("shelf") === "1",
    sort: SORTS.includes(sort) ? (sort as Sort) : "new",
  };
  const set = (patch: Partial<Filters>) => {
    const next = { ...f, ...patch };
    const out = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) {
      if (v === DEFAULT_FILTERS[k as keyof Filters] || v === null || v === "") continue;
      out.set(k, v === true ? "1" : String(v));
    }
    setSp(out, { replace: true });
  };
  return [f, set, () => setSp({}, { replace: true })];
}
