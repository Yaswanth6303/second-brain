import { fmtMins } from "../../../lib/format.ts";
import type { Item } from "../types.ts";

export function StatsStrip({ items }: { items: Item[] }) {
  const st = (k: Item["status"]) => items.filter((i) => i.status === k).length;
  const backlog = items.filter((i) => i.status !== "done").reduce((s, i) => s + i.mins, 0);
  const stats: [string | number, string][] = [
    [items.length, "links"],
    [st("queue"), "in queue"],
    [st("progress"), "in progress"],
    [st("done"), "finished"],
    [fmtMins(backlog), "left to get through"],
  ];
  return (
    <div className="text-muted mx-0.5 mt-3.5 mb-[22px] flex flex-wrap gap-x-[18px] gap-y-1.5 text-[.88rem]">
      {stats.map(([n, label]) => (
        <span key={label}>
          <b className="text-ink font-bold tabular-nums">{n}</b> {label}
        </span>
      ))}
    </div>
  );
}
