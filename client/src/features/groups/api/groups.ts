import { api } from "../../../lib/api-client.ts";
import type { Group, GroupLink } from "../types.ts";

export type GroupInput = { name: string; desc: string; members: string[] };

export const listGroups = () => api<{ groups: Group[] }>("/groups").then((r) => r.groups);
export const groupPage = (id: string) =>
  api<{ group: Group; watchlist: GroupLink[] }>(`/groups/${id}`);
export const createGroup = (body: GroupInput) =>
  api<{ group: Group }>("/groups", { method: "POST", body }).then((r) => r.group);
export const updateGroup = (id: string, body: GroupInput) =>
  api<{ group: Group }>(`/groups/${id}`, { method: "PATCH", body }).then((r) => r.group);
export const deleteGroup = (id: string) => api<void>(`/groups/${id}`, { method: "DELETE" });
export const leaveGroup = (id: string) => api<void>(`/groups/${id}/leave`, { method: "POST" });
