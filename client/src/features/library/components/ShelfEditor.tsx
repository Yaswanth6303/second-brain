import { useState } from "react";
import { Button } from "../../../components/ui/Button.tsx";
import { Modal } from "../../../components/ui/Modal.tsx";
import { useToast } from "../../../components/ui/Toast.tsx";
import { plural } from "../../../lib/format.ts";
import { domain } from "../../../lib/url.ts";
import { useAuth } from "../../auth/index.ts";
import { useItemMutations } from "../hooks/useItemMutations.ts";
import { useItems } from "../hooks/useItems.ts";
import { type Item, STATUS, typeDefs, typeOf } from "../types.ts";
import { TypeIcon } from "./bits.tsx";

const row = "border-line flex items-center gap-2 border-b px-3 py-2 last:border-b-0";

export function ShelfEditor({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  // Until the library loads, every link would look "not on the shelf"; saving then would empty it.
  const { items, isPending } = useItems();
  const m = useItemMutations();
  const toast = useToast();
  const defs = typeDefs(user!.customTypes);
  const byId = new Map(items.map((i) => [i.id, i]));
  const [ids, setIds] = useState(user!.shelf);
  const on = ids.map((id) => byId.get(id)).filter((i): i is Item => !!i);
  const off = items.filter((i) => !ids.includes(i.id));
  const [busy, setBusy] = useState(false);

  const add = (list: Item[]) =>
    setIds((cur) => [...cur, ...list.map((i) => i.id).filter((id) => !cur.includes(id))]);
  const move = (id: string, by: number) =>
    setIds((cur) => {
      const k = cur.indexOf(id);
      const j = k + by;
      if (k < 0 || j < 0 || j >= cur.length) return cur;
      const next = [...cur];
      [next[k], next[j]] = [next[j]!, next[k]!];
      return next;
    });

  const line = (i: Item) => (
    <>
      <TypeIcon t={typeOf(defs, i.type)} />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{i.title}</span>
        <span className="meta">
          {[domain(i.url), STATUS[i.status].label, i.fav ? "favourite" : ""]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
    </>
  );

  async function save() {
    setBusy(true);
    try {
      const saved = on.map((i) => i.id);
      await m.setShelf(saved);
      toast(saved.length ? `${plural(saved.length, "link")} on your shelf` : "Your shelf is empty");
      onClose();
    } catch {
      toast("Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Choose what is on your shelf"
      submitLabel="Save shelf"
      busy={busy || isPending}
      onClose={onClose}
      onSubmit={save}
    >
      <p className="meta mt-0">
        Friends see only the links you put here. The first link stands at the left end of the shelf.
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => add(items.filter((i) => i.fav))}>
          <i className="bi bi-star" /> Add all favourites
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => add(items.filter((i) => i.status === "done"))}
        >
          <i className="bi bi-check-circle" /> Add all finished
        </Button>
        <Button variant="outline" size="sm" onClick={() => setIds([])}>
          <i className="bi bi-x-lg" /> Clear the shelf
        </Button>
      </div>
      <h3 className="label">
        On your shelf <span className="n">{on.length}</span>
      </h3>
      {on.length ? (
        <ul className="border-line mb-6 list-none overflow-hidden rounded-[.6rem] border p-0">
          {on.map((i, k) => (
            <li key={i.id} className={row}>
              {line(i)}
              <button
                type="button"
                className="btn-icon disabled:opacity-35"
                aria-label={`Move ${i.title} left`}
                title="Move left"
                disabled={!k}
                onClick={() => move(i.id, -1)}
              >
                <i className="bi bi-arrow-up" />
              </button>
              <button
                type="button"
                className="btn-icon disabled:opacity-35"
                aria-label={`Move ${i.title} right`}
                title="Move right"
                disabled={k === on.length - 1}
                onClick={() => move(i.id, 1)}
              >
                <i className="bi bi-arrow-down" />
              </button>
              <button
                type="button"
                className="btn-icon"
                aria-label={`Take ${i.title} off the shelf`}
                title="Take off the shelf"
                onClick={() => setIds((cur) => cur.filter((x) => x !== i.id))}
              >
                <i className="bi bi-x-lg" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="note mb-6">Empty. Friends see no links until you add some.</p>
      )}
      <h3 className="label">
        Private, not on your shelf <span className="n">{off.length}</span>
      </h3>
      {off.length ? (
        <ul className="border-line list-none overflow-hidden rounded-[.6rem] border p-0">
          {off.map((i) => (
            <li key={i.id} className={row}>
              {line(i)}
              <Button variant="outline-primary" size="sm" onClick={() => add([i])}>
                <i className="bi bi-plus-lg" /> Add
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="note mb-0">Every link you saved is on your shelf.</p>
      )}
    </Modal>
  );
}
