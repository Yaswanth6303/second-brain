import { api } from "../../../lib/api-client.ts";
import type { InboxEntry } from "../types.ts";

export const listInbox = () => api<{ entries: InboxEntry[] }>("/inbox").then((r) => r.entries);
export const openEntry = (id: string) => api<void>(`/inbox/${id}/open`, { method: "POST" });
export const dismissEntry = (id: string) => api<void>(`/inbox/${id}/dismiss`, { method: "POST" });
// Saving works from the inbox or a group page, so it goes by share.
export const saveShare = (shareId: string) =>
  api<unknown>(`/shares/${shareId}/save`, { method: "POST" });
