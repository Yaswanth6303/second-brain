import type { Item } from "../features/library/types.ts";

export const me = {
  id: "u1",
  name: "Aarav Mehta",
  handle: "aarav",
  email: "aarav@example.com",
  bio: "",
  hue: 168,
  prefs: { who: "friends" as const, status: true, pub: false, digest: true, dust: true },
  createdAt: "2026-01-01T00:00:00.000Z",
  shelf: [] as string[],
  collections: ["Career"],
  customTypes: [] as { key: string; label: string; plural: string; icon: string }[],
};

export const mkItem = (id: string, o: Partial<Item> = {}): Item => ({
  id,
  url: `https://example.com/${id}`,
  title: `Link ${id}`,
  type: "article",
  tags: [],
  mins: 10,
  status: "queue",
  fav: false,
  note: "",
  coll: "",
  remindAt: null,
  savedAt: new Date().toISOString(),
  ...o,
});
