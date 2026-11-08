import { useState } from "react";
import { SideCard } from "../../../components/layout/RightRail.tsx";
import { Button } from "../../../components/ui/Button.tsx";
import { fmtDay, fmtMins, rel } from "../../../lib/format.ts";
import { useAuth } from "../../auth/index.ts";
import { useItemActions } from "../hooks/useItemActions.ts";
import { isDust, pickPool } from "../lib/filter.ts";
import { type Item, type TypeDef, typeOf } from "../types.ts";
import { dur } from "../lib/display.ts";
import { TypeIcon } from "./bits.tsx";
import { useItemForm } from "./ItemFormProvider.tsx";

const BUDGETS: [number, string][] = [
  [15, "15 min"],
  [30, "30 min"],
  [60, "1 h"],
  [0, "Any"],
];

export function PickCard({ items, defs }: { items: Item[]; defs: Record<string, TypeDef> }) {
  const [budget, setBudget] = useState(30);
  const [pickId, setPickId] = useState<string | null>(null);
  const a = useItemActions();
  const pool = pickPool(items, budget);
  const p = pool.find((i) => i.id === pickId) ?? pool[0];

  // Steps through the pool in order, so "Another" never repeats until it wraps.
  function another() {
    const next = pool[(pool.indexOf(p!) + 1) % pool.length];
    if (next) setPickId(next.id);
  }

  return (
    <SideCard title="Pick for me">
      <p className="meta m-0">How much time do you have?</p>
      <div className="flex flex-wrap gap-1.5">
        {BUDGETS.map(([v, l]) => (
          <button
            key={v}
            type="button"
            className={`pill ${budget === v ? "on" : ""}`}
            aria-pressed={budget === v}
            onClick={() => (setBudget(v), setPickId(null))}
          >
            {l}
          </button>
        ))}
      </div>
      {p ? (
        <>
          <div className="flex items-start gap-2">
            <TypeIcon t={typeOf(defs, p.type)} />
            <div className="min-w-0">
              <a className="item-title sm" href={p.url} target="_blank" rel="noopener noreferrer">
                {p.title}
              </a>
              <div className="meta">
                {dur(p.mins, typeOf(defs, p.type))} · saved {rel(p.savedAt)}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={pool.length < 2}
              onClick={another}
            >
              <i className="bi bi-shuffle" /> Another
            </Button>
            <Button size="sm" className="flex-1" onClick={() => a.start(p)}>
              Start it
            </Button>
          </div>
        </>
      ) : (
        <p className="note">
          {budget
            ? `Nothing in your queue fits ${fmtMins(budget)}. Try a longer slot.`
            : "Add minutes to a link and it can be picked."}
        </p>
      )}
    </SideCard>
  );
}

export function RemindersCard({ items }: { items: Item[] }) {
  const form = useItemForm();
  const showDust = useAuth().user!.prefs.dust;
  const reminders = items
    .filter((i) => i.remindAt)
    .sort((a, b) => a.remindAt!.localeCompare(b.remindAt!));
  const dust = showDust ? items.filter((i) => isDust(i)) : [];
  return (
    <SideCard title="Reminders">
      {reminders.length || dust.length ? (
        <ul className="side-list">
          {reminders.map((i) => (
            <li key={`r-${i.id}`}>
              <i className="bi bi-bell" />
              <div className="min-w-0">
                <b>{i.title}</b>
                <div className="meta">{fmtDay(i.remindAt!)}</div>
              </div>
            </li>
          ))}
          {dust.map((i) => (
            <li key={`d-${i.id}`}>
              <i className="bi bi-hourglass-split" />
              <div className="min-w-0">
                <b>{i.title}</b>
                <div className="meta">
                  In your queue since {rel(i.savedAt)}.{" "}
                  <button type="button" className="linkish" onClick={() => form.confirmDelete(i)}>
                    Let it go
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="note">No reminders. Set one when you save or edit a link.</p>
      )}
    </SideCard>
  );
}
