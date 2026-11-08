import type { Filters } from "../lib/filter.ts";
import { type Item, STATUS, type TypeDef } from "../types.ts";

export type Layout = "grid" | "list";

type Props = {
  items: Item[];
  defs: Record<string, TypeDef>;
  f: Filters;
  set: (p: Partial<Filters>) => void;
  onReset: () => void;
  layout: Layout;
  onLayout: (l: Layout) => void;
};

const SORT_LABELS: [Filters["sort"], string][] = [
  ["new", "Newest first"],
  ["old", "Oldest first"],
  ["short", "Shortest first"],
  ["az", "Name A to Z"],
];

const selectCls =
  "field h-[34px] w-auto! min-w-0 rounded-full py-0 pl-3.5 text-[.86rem] font-semibold";

export function Toolbar({ items, defs, f, set, onReset, layout, onLayout }: Props) {
  const count = (t: string) =>
    t === "all" ? items.length : items.filter((i) => i.type === t).length;
  // Custom types only get a pill once a link uses them, as in the prototype.
  const types = [
    "all",
    ...Object.values(defs)
      .filter((t) => !t.custom || count(t.key))
      .map((t) => t.key),
  ];
  const dirty =
    f.type !== "all" ||
    f.status !== "all" ||
    !!f.tag ||
    !!f.coll ||
    !!f.q ||
    f.fav ||
    f.shelf ||
    f.sort !== "new";

  return (
    <div className="mb-3.5 flex flex-wrap items-center gap-x-3 gap-y-2.5">
      <div
        className="flex max-w-full min-w-0 gap-1.5 overflow-x-auto pb-0.5"
        role="group"
        aria-label="Filter by type"
      >
        {types.map((t) => (
          <button
            key={t}
            type="button"
            className={`pill ${f.type === t ? "on" : ""}`}
            aria-pressed={f.type === t}
            onClick={() => set({ type: t })}
          >
            {t === "all" ? "All" : defs[t]!.plural}
            <span className="n">{count(t)}</span>
          </button>
        ))}
      </div>
      <div className="flex min-w-0 flex-auto flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 gap-2 max-sm:flex-[1_1_100%]">
          <select
            className={selectCls}
            aria-label="Filter by status"
            value={f.status}
            onChange={(e) => set({ status: e.target.value as Filters["status"] })}
          >
            <option value="all">Any status</option>
            {Object.entries(STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <select
            className={selectCls}
            aria-label="Sort"
            value={f.sort}
            onChange={(e) => set({ sort: e.target.value as Filters["sort"] })}
          >
            {SORT_LABELS.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 max-sm:flex-[1_1_100%]">
          <button
            type="button"
            className={`pill ${f.fav ? "on" : ""}`}
            aria-pressed={f.fav}
            aria-label="Show favourites only"
            title="Favourites only"
            onClick={() => set({ fav: !f.fav })}
          >
            <i className={`bi ${f.fav ? "bi-star-fill" : "bi-star"}`} />
            <span className="hidden sm:inline">Favourites</span>
          </button>
          <button
            type="button"
            className={`pill ${f.shelf ? "on" : ""}`}
            aria-pressed={f.shelf}
            aria-label="Show links on my shelf only"
            title="On my shelf only"
            onClick={() => set({ shelf: !f.shelf })}
          >
            <i className="bi bi-bookshelf" />
            <span className="hidden sm:inline">On my shelf</span>
          </button>
          <button
            type="button"
            className="pill"
            disabled={!dirty}
            aria-label="Reset filters and sorting"
            title="Reset filters and sorting"
            onClick={onReset}
          >
            <i className="bi bi-arrow-counterclockwise" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <div className="flex flex-none max-sm:ml-auto" role="group" aria-label="View">
            {(["grid", "list"] as const).map((l, k) => (
              <button
                key={l}
                type="button"
                aria-pressed={layout === l}
                aria-label={l === "grid" ? "Card view" : "List view"}
                title={l === "grid" ? "Cards" : "List"}
                onClick={() => onLayout(l)}
                className={`btn-icon bordered w-10! ${k ? "-ml-px rounded-l-none rounded-r-full" : "rounded-l-full rounded-r-none"} ${layout === l ? "bg-ink! border-ink! text-bg!" : ""}`}
              >
                <i className={`bi ${l === "grid" ? "bi-grid" : "bi-list-ul"}`} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ActiveFilters({
  f,
  set,
  count,
  onClear,
}: {
  f: Filters;
  set: (p: Partial<Filters>) => void;
  count: number;
  onClear: () => void;
}) {
  const chips: { icon: string; label: string; off: Partial<Filters> }[] = [];
  if (f.coll) chips.push({ icon: "bi-folder2", label: f.coll, off: { coll: null } });
  if (f.tag) chips.push({ icon: "bi-hash", label: f.tag, off: { tag: null } });
  if (f.q) chips.push({ icon: "bi-search", label: f.q, off: { q: "" } });
  if (f.fav) chips.push({ icon: "bi-star-fill", label: "Favourites", off: { fav: false } });
  if (f.shelf) chips.push({ icon: "bi-bookshelf", label: "On my shelf", off: { shelf: false } });
  if (!chips.length) return null;
  return (
    <div className="text-muted mb-3.5 flex flex-wrap items-center gap-2 text-[.86rem]">
      Showing {count} {count === 1 ? "link" : "links"} for
      {chips.map((c) => (
        <button
          key={c.icon}
          type="button"
          className="tag on"
          aria-label={`Remove filter ${c.label}`}
          onClick={() => set(c.off)}
        >
          <i className={`bi ${c.icon}`} />
          {c.label} <i className="bi bi-x" />
        </button>
      ))}
      <button type="button" className="linkish" onClick={onClear}>
        Clear all
      </button>
    </div>
  );
}
