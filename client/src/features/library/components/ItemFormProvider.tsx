import { type ReactNode, createContext, useContext, useState } from "react";
import { Modal } from "../../../components/ui/Modal.tsx";
import { useToast } from "../../../components/ui/Toast.tsx";
import { useItemMutations } from "../hooks/useItemMutations.ts";
import type { Item } from "../types.ts";
import { ItemForm } from "./ItemForm.tsx";

type Open =
  | { kind: "new"; preUrl?: string; coll?: string; onSaved?: () => void }
  | { kind: "edit"; item: Item }
  | { kind: "delete"; item: Item };

type Api = {
  openNew: (preUrl?: string, opts?: { coll?: string; onSaved?: () => void }) => void;
  openEdit: (item: Item) => void;
  confirmDelete: (item: Item) => void;
};

const ItemFormContext = createContext<Api | null>(null);

// One place that owns the add/edit form and the delete confirmation, so any page can open them.
export function ItemFormProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<Open | null>(null);
  const m = useItemMutations();
  const toast = useToast();
  const close = () => setOpen(null);
  const api: Api = {
    openNew: (preUrl, opts) =>
      setOpen({ kind: "new", preUrl, coll: opts?.coll, onSaved: opts?.onSaved }),
    openEdit: (item) => setOpen({ kind: "edit", item }),
    confirmDelete: (item) => setOpen({ kind: "delete", item }),
  };
  return (
    <ItemFormContext.Provider value={api}>
      {children}
      {open?.kind === "new" && (
        <ItemForm
          preUrl={open.preUrl}
          defaultColl={open.coll}
          onSaved={open.onSaved}
          onClose={close}
        />
      )}
      {open?.kind === "edit" && <ItemForm item={open.item} onClose={close} />}
      {open?.kind === "delete" && (
        <Modal
          title="Delete this link?"
          submitLabel="Delete link"
          danger
          onClose={close}
          onSubmit={async () => {
            try {
              await m.remove(open.item.id);
              close();
              toast("Link deleted");
            } catch {
              toast("Could not delete the link. Try again.");
            }
          }}
        >
          <p className="m-0">
            "{open.item.title}" leaves your library and every watchlist it is on.
          </p>
        </Modal>
      )}
    </ItemFormContext.Provider>
  );
}

export function useItemForm(): Api {
  const ctx = useContext(ItemFormContext);
  if (!ctx) throw new Error("useItemForm needs <ItemFormProvider>");
  return ctx;
}
