import { useToast } from "../../../components/ui/Toast.tsx";
import { useAuth } from "../../auth/index.ts";
import { type Item, type ItemStatus, STATUS } from "../types.ts";
import { useItemMutations } from "./useItemMutations.ts";

const NEXT: Record<ItemStatus, ItemStatus> = { queue: "progress", progress: "done", done: "queue" };

// The one-click actions on a card or row, with the prototype's toasts.
export function useItemActions() {
  const m = useItemMutations();
  const toast = useToast();
  const shelf = useAuth().user!.shelf;
  const failed = () => toast("Could not save. Try again.");

  return {
    onShelf: (item: Item) => shelf.includes(item.id),
    cycleStatus(item: Item) {
      const status = NEXT[item.status];
      m.update(item.id, { status }).then(
        () => toast(`Marked as ${STATUS[status].label.toLowerCase()}`),
        failed,
      );
    },
    start(item: Item) {
      m.update(item.id, { status: "progress" }).then(
        () => toast(`"${item.title}" is in progress`),
        failed,
      );
    },
    toggleFav(item: Item) {
      m.update(item.id, { fav: !item.fav }).catch(failed);
    },
    toggleShelf(item: Item) {
      const on = !shelf.includes(item.id);
      m.setShelf(on ? [...shelf, item.id] : shelf.filter((id) => id !== item.id)).then(
        () =>
          toast(on ? "On your shelf. Friends can see it." : "Off your shelf. Only you can see it."),
        failed,
      );
    },
    copy(item: Item) {
      navigator.clipboard
        .writeText(item.url)
        .then(() => toast("Copied"))
        .catch(() => toast("Copy is blocked here. Select the text and copy it yourself."));
    },
  };
}
