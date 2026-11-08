import { Fragment, useState } from "react";
import { Link } from "react-router";
import { SideCard } from "../../../components/layout/RightRail.tsx";
import { Avatar } from "../../../components/ui/Avatar.tsx";
import { fmtMins, plural } from "../../../lib/format.ts";
import { type Person, firstName } from "../../friends/index.ts";
import { type Item, tagCounts, typeColor, type typeDefs } from "../../library/index.ts";

type Defs = ReturnType<typeof typeDefs>;

export function TimeByType({ items, defs }: { items: Item[]; defs: Defs }) {
  const rows = Object.values(defs)
    .map((t) => {
      const l = items.filter((i) => i.type === t.key);
      return { t, n: l.length, m: l.reduce((s, i) => s + i.mins, 0) };
    })
    .filter((r) => r.n);
  const max = Math.max(1, ...rows.map((r) => r.m));
  const total = rows.reduce((s, r) => s + r.m, 0);
  return (
    <SideCard title="Time on your shelf">
      <p className="meta m-0">{fmtMins(total)} of reading, watching and listening, by type.</p>
      <div className="flex flex-col gap-3.5">
        {rows.map(({ t, n, m }) => {
          const v = `${m ? fmtMins(m) : "No length set"} · ${plural(n, "link")}`;
          return (
            <div
              key={t.key}
              style={typeColor(t)}
              title={`${t.plural}: ${v}`}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-[5px] text-[.88rem]"
            >
              <span className="inline-flex items-center gap-2 font-semibold">
                <i className={`bi ${t.icon} text-(--tc)`} />
                {t.plural}
              </span>
              <span className="text-muted tabular-nums">{v}</span>
              <span className="border-line col-span-full block h-2.5 border-l">
                <span
                  className="block h-full rounded-r bg-(--tc)"
                  style={{ width: `${(m / max) * 100}%` }}
                />
              </span>
            </div>
          );
        })}
      </div>
    </SideCard>
  );
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SHADES = [
  "bg-surface-2",
  "bg-[color-mix(in_srgb,var(--color-brand)_38%,var(--color-surface))]",
  "bg-[color-mix(in_srgb,var(--color-brand)_68%,var(--color-surface))]",
  "bg-brand",
];

// Six weeks of saves, Monday-first, ending this week (prototype saveCalendar).
export function SaveCalendar({ items }: { items: Item[] }) {
  const [today] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const start = new Date(today);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - 35);
  const counts: Record<string, number> = {};
  for (const i of items) {
    const k = new Date(i.savedAt).toDateString();
    counts[k] = (counts[k] ?? 0) + 1;
  }
  const weeks = Array.from({ length: 6 }, (_, w) => {
    const ws = new Date(start);
    ws.setDate(ws.getDate() + w * 7);
    const days = Array.from({ length: 7 }, (_, d) => {
      const day = new Date(ws);
      day.setDate(day.getDate() + d);
      if (day > today) return null;
      const n = counts[day.toDateString()] ?? 0;
      const label = day.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      return { n, label, today: +day === +today };
    });
    return { label: ws.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), days };
  });
  const all = weeks.flatMap((w) => w.days).filter((d) => !!d);
  const total = all.reduce((s, d) => s + d.n, 0);
  const top = all.reduce<{ n: number; label: string } | null>(
    (b, d) => (d.n && (!b || d.n > b.n) ? d : b),
    null,
  );
  const cell = "block h-6 rounded-[5px]";
  return (
    <SideCard title="When you save">
      <p className="meta m-0">
        {plural(total, "link")} in the last 6 weeks.
        {top && top.n > 1 ? ` Busiest day: ${top.label}, with ${top.n}.` : ""}
      </p>
      <div
        role="img"
        aria-label={`Links saved per day over the last 6 weeks, ${total} in total`}
        className="grid grid-cols-[auto_repeat(7,minmax(0,1fr))] items-center gap-1"
      >
        <span />
        {DAYS.map((d) => (
          <span key={d} className="text-muted text-center text-[.7rem]">
            {d}
          </span>
        ))}
        {weeks.map((w) => (
          <Fragment key={w.label}>
            <span className="text-muted pr-1.5 font-mono text-[.7rem] whitespace-nowrap">
              {w.label}
            </span>
            {w.days.map((d, k) =>
              d ? (
                <span
                  key={`${w.label}-${k}`}
                  title={`${d.label}: ${d.n ? `${plural(d.n, "link")} saved` : "nothing saved"}`}
                  className={`${cell} ${SHADES[Math.min(d.n, 3)]} ${d.today ? "outline-ink outline-2 outline-offset-1" : ""}`}
                />
              ) : (
                <span key={`${w.label}-${k}`} className={cell} />
              ),
            )}
          </Fragment>
        ))}
      </div>
      <div className="text-muted flex flex-wrap items-center gap-1.5 text-[.76rem]">
        <span>Links saved in a day</span>
        {[0, 1, 2, 3].map((n) => (
          <span key={n} className="inline-flex items-center gap-1.5">
            <span className={`block size-4 rounded-[5px] ${SHADES[n]}`} />
            {n === 3 ? "3+" : n}
          </span>
        ))}
        <span className="bg-surface-2 outline-ink ml-2 block size-4 rounded-[5px] outline-2 outline-offset-1" />
        <span>Today</span>
      </div>
    </SideCard>
  );
}

type Exchange = { user: Person; sent: number; received: number };

export function GiveAndTake({ friends }: { friends: Exchange[] }) {
  const rows = friends
    .filter((r) => r.sent + r.received)
    .toSorted((a, b) => b.sent + b.received - (a.sent + a.received));
  const max = Math.max(1, ...rows.flatMap((r) => [r.sent, r.received]));
  const bar = (n: number, cls: string) => (
    <span
      className={`block h-2.5 flex-none ${cls}`}
      style={{ width: `calc((100% - 24px) * ${n / max})` }}
    />
  );
  const grid = "grid grid-cols-[minmax(0,1fr)_100px_minmax(0,1fr)] items-center gap-2";
  return (
    <SideCard title="Give and take">
      <p className="meta m-0">
        Links you and each friend sent one to one. Group links are not counted.
      </p>
      {rows.length ? (
        <div className="flex flex-col gap-2.5">
          <div className={`${grid} text-muted text-[.8rem]`}>
            <span className="inline-flex items-center justify-end gap-1.5">
              You sent <i className="key bg-brand border-brand" />
            </span>
            <span />
            <span className="inline-flex items-center gap-1.5">
              <i className="key key-done" /> They sent
            </span>
          </div>
          {rows.map((r) => (
            <div key={r.user.id} className={grid}>
              <span
                className="flex min-w-0 items-center justify-end gap-1.5 py-1"
                title={`You sent ${firstName(r.user)} ${plural(r.sent, "link")}`}
              >
                <b className="n text-ink! w-[18px] flex-none text-right">{r.sent}</b>
                {bar(r.sent, "bg-brand rounded-l")}
              </span>
              <Link
                to={`/friends/${r.user.id}`}
                className="text-ink hover:text-brand inline-flex min-w-0 items-center justify-center gap-1.5 text-[.86rem] font-semibold no-underline"
              >
                <Avatar name={r.user.name} hue={r.user.hue} size={22} />
                {firstName(r.user)}
              </Link>
              <span
                className="flex min-w-0 items-center gap-1.5 py-1"
                title={`${firstName(r.user)} sent you ${plural(r.received, "link")}`}
              >
                {bar(r.received, "bg-muted rounded-r")}
                <b className="n text-ink! w-[18px] flex-none">{r.received}</b>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="note">Send a friend a link and it shows up here.</p>
      )}
    </SideCard>
  );
}

export function TagCloud({ items }: { items: Item[] }) {
  const tags = tagCounts(items).slice(0, 12);
  return (
    <SideCard title="What you save about">
      <p className="meta m-0">Pick a tag to see those links in your library.</p>
      {tags.length ? (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(([t, n]) => (
            <Link key={t} to={`/library?tag=${encodeURIComponent(t)}`} className="tag no-underline">
              #{t} <span className="n">{n}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="note">Add tags when you save a link.</p>
      )}
    </SideCard>
  );
}
