import { api } from "../../../lib/api-client.ts";
import type { Person } from "../types.ts";

export type FriendSummary = {
  user: Person;
  since: string;
  sent: number;
  done: number;
  received: number;
};
export type FriendsList = {
  friends: FriendSummary[];
  requests: { id: string; user: Person }[];
  sent: { id: string; user: Person }[];
};

export const listFriends = () => api<FriendsList>("/friends");

export const sendRequest = (who: string) =>
  api<{ id?: string; friend?: true; user: Person }>("/friends/requests", {
    method: "POST",
    body: { who },
  });

export const acceptRequest = (id: string) =>
  api<{ user: Person }>(`/friends/requests/${id}/accept`, { method: "POST" });

export const declineRequest = (id: string) =>
  api<void>(`/friends/requests/${id}/decline`, { method: "POST" });

export const removeFriend = (userId: string) =>
  api<void>(`/friends/${userId}`, { method: "DELETE" });

export type FriendPageData = {
  user: Person;
  since: string;
  watchlist: {
    id: string;
    item: { url: string; title: string; type: string; mins: number };
    at: string;
    seen: "new" | "opened" | "done";
    react: string;
  }[];
  received: import("../../inbox/index.ts").InboxEntry[];
  shelf: {
    id: string;
    url: string;
    title: string;
    type: string;
    mins: number;
    fav: boolean;
    savedAt: string;
    status?: string;
  }[];
};

export const friendPage = (id: string) => api<FriendPageData>(`/friends/${id}`);
