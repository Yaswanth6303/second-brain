import { fmtMins } from "../../../lib/format.ts";
import { typeColor } from "../lib/display.ts";
import { STATUS, type TypeDef, typeOf } from "../types.ts";

export type ShelfLink = {
  id: string;
  url: string;
  title: string;
  type: string;
  mins: number;
  fav: boolean;
  status?: string;
  savedAt: string;
};

const SPINE_H: Record<string, number> = {
  article: 190,
  video: 170,
  podcast: 180,
  course: 205,
  tool: 160,
};
const STATUSES = [
  ["done", "Finished"],
  ["progress", "In progress"],
  ["queue", "In queue"],
] as const;

// Same proportions as the prototype: longer links are thicker spines.
function spine(it: ShelfLink) {
  const w = Math.round(34 + Math.sqrt(Math.min(it.mins, 300) / 300) * 40);
  const cap = Math.max(1, Math.floor((w - 12) / 17)) * (it.fav ? 16 : 18);
  const title = it.title.length > cap ? it.title.slice(0, cap - 1).trimEnd() + "…" : it.title;
  return { w, title };
}

export function Shelf({ items, defs }: { items: ShelfLink[]; defs: Record<string, TypeDef> }) {
  if (!items.length) return <p className="note">Nothing on the shelf yet.</p>;
  const types = [...new Set(items.map((i) => i.type))];
  return (
    <>
      <div className="overflow-x-auto pt-3">
        <div className="border-line flex min-w-max items-end gap-[3px] border-b-[6px] px-2.5">
          {items.map((it) => {
            const t = typeOf(defs, it.type);
            const { w, title } = spine(it);
            const status =
              it.status && it.status in STATUS
                ? STATUS[it.status as keyof typeof STATUS].label
                : "";
            const tip = [it.title, t.label, it.mins ? fmtMins(it.mins) : "", status]
              .filter(Boolean)
              .join(" · ");
            return (
              <a
                key={it.id}
                href={it.url}
                target="_blank"
                rel="noopener noreferrer"
                title={tip}
                aria-label={tip}
                className={`spine sp-${it.status ?? "queue"}`}
                style={{ ...typeColor(t), width: w, height: SPINE_H[it.type] ?? 175 }}
              >
                {it.fav && (
                  <i
                    className={`bi bi-star-fill text-[.68rem] ${it.status === "done" ? "" : "text-warn"}`}
                  />
                )}
                <span className="sp-title">{title}</span>
                <i
                  className={`bi ${t.icon} text-[.95rem] ${it.status === "done" ? "" : "text-(--tc)"}`}
                />
              </a>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[.84rem]">
        {STATUSES.filter(([k]) => items.some((i) => (i.status ?? "queue") === k)).map(([k, l]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <i className={`key key-${k}`} />
            {l} <b className="n">{items.filter((i) => (i.status ?? "queue") === k).length}</b>
          </span>
        ))}
        <span className="bg-line h-3.5 w-px" />
        {types.map((k) => {
          const t = typeOf(defs, k);
          return (
            <span key={k} className="inline-flex items-center gap-1.5" style={typeColor(t)}>
              <i className="key key-type" />
              {t.plural}
            </span>
          );
        })}
      </div>
    </>
  );
}
