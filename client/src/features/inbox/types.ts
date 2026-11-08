import type { Person } from "../friends/types.ts";

export type InboxEntry = {
  id: string;
  shareId: string;
  from: Person;
  group: { id: string; name: string } | null;
  url: string;
  title: string;
  type: string;
  mins: number;
  msg: string;
  at: string;
  state: "new" | "saved" | "dismissed";
};
