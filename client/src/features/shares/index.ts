export { deleteShare } from "./api/shares.ts";
export { FriendActivityCard } from "./components/FriendActivityCard.tsx";
export { ShareAvatars } from "./components/ShareAvatars.tsx";
export { ShareTargets } from "./components/ShareTargets.tsx";
export { SharesProvider, useShares } from "./components/SharesProvider.tsx";
export { useSentShares, useSentSharesQuery } from "./hooks/useSentShares.ts";
export { applyShareDiff } from "./lib/diff.ts";
export type { SentShare, Target } from "./types.ts";
