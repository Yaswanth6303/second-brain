import type { Person } from "../friends/index.ts";

export type SentShare = {
  id: string;
  item: string;
  title: string;
  kind: "friend" | "group";
  to: Person | { id: string; name: string };
  seen: "new" | "opened" | "done";
  seenAt: string | null;
  done: { user: Person; at: string }[];
  react: string;
  at: string;
};

export type Target = { kind: "friend" | "group"; id: string; label: string };
