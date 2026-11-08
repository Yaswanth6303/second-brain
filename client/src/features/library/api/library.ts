import { api } from "../../../lib/api-client.ts";
import type { CustomType, Item, ItemInput } from "../types.ts";

export const listItems = () => api<{ items: Item[] }>("/items").then((r) => r.items);

export const createItem = (body: ItemInput) =>
  api<{ item: Item }>("/items", { method: "POST", body }).then((r) => r.item);

export const updateItem = (id: string, body: Partial<Item>) =>
  api<{ item: Item }>(`/items/${id}`, { method: "PATCH", body }).then((r) => r.item);

export const deleteItem = (id: string) => api<void>(`/items/${id}`, { method: "DELETE" });

export const addCollection = (name: string) =>
  api<{ name: string; collections: string[] }>("/users/me/collections", {
    method: "POST",
    body: { name },
  });

export const addType = (label: string, icon: string) =>
  api<{ key: string; customTypes: CustomType[] }>("/users/me/types", {
    method: "POST",
    body: { label, icon },
  });

export const setShelf = (ids: string[]) =>
  api<{ shelf: string[] }>("/users/me/shelf", { method: "PUT", body: { ids } });
