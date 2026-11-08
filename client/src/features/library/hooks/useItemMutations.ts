import { useQueryClient } from "@tanstack/react-query";
import { ME, type User } from "../../auth/index.ts";
import * as api from "../api/library.ts";
import type { Item, ItemInput } from "../types.ts";
import { ITEMS } from "./useItems.ts";

export function useItemMutations() {
  const qc = useQueryClient();
  // Read the caches fresh on every call so back-to-back updates never use a stale copy.
  const items = () => qc.getQueryData<Item[]>(ITEMS) ?? [];
  const setItems = (l: Item[]) => qc.setQueryData(ITEMS, l);
  const me = () => qc.getQueryData<User>(ME)!;
  const patchMe = (p: Partial<User>) => qc.setQueryData<User>(ME, { ...me(), ...p });

  return {
    async create(input: ItemInput) {
      const item = await api.createItem(input);
      setItems([item, ...items()]);
      return item;
    },
    // Optimistic: the change shows at once and is rolled back if the server refuses it.
    async update(id: string, patch: Partial<Item>) {
      // A refetch already in flight would overwrite the optimistic change when it lands.
      await qc.cancelQueries({ queryKey: ITEMS });
      const prev = items().find((i) => i.id === id);
      setItems(items().map((i) => (i.id === id ? { ...i, ...patch } : i)));
      try {
        const item = await api.updateItem(id, patch);
        setItems(items().map((i) => (i.id === id ? item : i)));
        return item;
      } catch (e) {
        // Restore only this item, so other updates made meanwhile survive.
        if (prev) setItems(items().map((i) => (i.id === id ? prev : i)));
        throw e;
      }
    },
    async remove(id: string) {
      await api.deleteItem(id);
      setItems(items().filter((i) => i.id !== id));
      patchMe({ shelf: me().shelf.filter((s) => s !== id) });
    },
    async setShelf(ids: string[]) {
      const before = me().shelf;
      patchMe({ shelf: ids });
      try {
        await api.setShelf(ids);
      } catch (e) {
        patchMe({ shelf: before });
        throw e;
      }
    },
    async addCollection(name: string) {
      const r = await api.addCollection(name);
      patchMe({ collections: r.collections });
      return r.name;
    },
    async addType(label: string, icon: string) {
      const r = await api.addType(label, icon);
      patchMe({ customTypes: r.customTypes });
      return r.key;
    },
  };
}
