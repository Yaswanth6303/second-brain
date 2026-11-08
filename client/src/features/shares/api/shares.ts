import { api } from "../../../lib/api-client.ts";
import type { SentShare } from "../types.ts";

export type NewShares = {
  itemIds: string[];
  friends: string[];
  groups: string[];
  handles: string[];
  msg: string;
};

export const createShares = (body: NewShares) =>
  api<{ shares: unknown[] }>("/shares", { method: "POST", body });
export const listSent = () => api<{ shares: SentShare[] }>("/shares/sent").then((r) => r.shares);
export const deleteShare = (id: string) => api<void>(`/shares/${id}`, { method: "DELETE" });
export const react = (id: string, text: string) =>
  api<void>(`/shares/${id}/react`, { method: "PATCH", body: { react: text } });
