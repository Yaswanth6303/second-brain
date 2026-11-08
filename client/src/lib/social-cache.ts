import type { QueryClient } from "@tanstack/react-query";

// Friends, shares, inbox, groups and notifications all describe the same data,
// so a change to any of them refreshes every view of it.
const SOCIAL_KEYS = [
  "friends",
  "friend",
  "inbox",
  "shares-sent",
  "groups",
  "group",
  "notifications",
  "items",
];

export const refreshSocial = (qc: QueryClient) =>
  Promise.all(SOCIAL_KEYS.map((k) => qc.invalidateQueries({ queryKey: [k] })));
