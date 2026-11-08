import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Modal } from "../../../components/ui/Modal.tsx";
import { useToast } from "../../../components/ui/Toast.tsx";
import { plural } from "../../../lib/format.ts";
import { refreshSocial } from "../../../lib/social-cache.ts";
import { useAuth } from "../../auth/index.ts";
import { TypeIcon, metaLine, typeDefs, typeOf, useItems } from "../../library/index.ts";
import { createShares } from "../api/shares.ts";
import { useSentShares } from "../hooks/useSentShares.ts";
import type { Target } from "../types.ts";

// Adds several library links to one friend's or group's watchlist.
export function PickModal({ target, onClose }: { target: Target; onClose: () => void }) {
  const sent = useSentShares();
  const defs = typeDefs(useAuth().user!.customTypes);
  const avail = useItems().items.filter(
    (i) => !sent.some((s) => s.item === i.id && s.kind === target.kind && s.to.id === target.id),
  );
  const [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();

  async function submit() {
    if (!avail.length) return onClose();
    if (!ids.length) return toast("Pick at least one link");
    setBusy(true);
    try {
      const to =
        target.kind === "friend"
          ? { friends: [target.id], groups: [] }
          : { friends: [], groups: [target.id] };
      await createShares({ itemIds: ids, ...to, handles: [], msg: "" });
      toast(`Added ${plural(ids.length, "link")} to ${target.label}`);
      await refreshSocial(qc);
      onClose();
    } catch {
      toast("Could not add the links. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={`Add to ${target.label}`}
      submitLabel="Add to watchlist"
      busy={busy}
      onClose={onClose}
      onSubmit={submit}
    >
      {avail.length ? (
        <>
          <p className="meta mt-0">Pick links from your library.</p>
          <div className="border-line overflow-hidden rounded-[.6rem] border">
            {avail.map((i) => {
              const t = typeOf(defs, i.type);
              return (
                <label
                  key={i.id}
                  className="border-line hover:bg-surface-2 flex cursor-pointer items-center gap-2 border-b px-3 py-2 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    className="check flex-none"
                    aria-label={i.title}
                    checked={ids.includes(i.id)}
                    onChange={() =>
                      setIds((l) => (l.includes(i.id) ? l.filter((x) => x !== i.id) : [...l, i.id]))
                    }
                  />
                  <TypeIcon t={t} />
                  <span className="min-w-0">
                    <span className="block font-semibold">{i.title}</span>
                    <span className="meta">{metaLine(i, t)}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </>
      ) : (
        <p className="m-0">Every link in your library is already on this watchlist.</p>
      )}
    </Modal>
  );
}
