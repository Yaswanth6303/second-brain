import { createShares, deleteShare } from "../api/shares.ts";
import type { SentShare } from "../types.ts";

export type Picked = { friends: string[]; groups: string[]; handles: string[]; msg: string };

// Makes an item's shares match what is ticked: removes unticked targets, adds new ones.
// Returns how many watchlists the item is on afterwards.
export async function applyShareDiff(
  itemId: string,
  current: SentShare[],
  p: Picked,
): Promise<number> {
  const has = (kind: SentShare["kind"], id: string) =>
    current.some((s) => s.kind === kind && s.to.id === id);
  const removed = current.filter(
    (s) => !(s.kind === "friend" ? p.friends : p.groups).includes(s.to.id),
  );
  const friends = p.friends.filter((id) => !has("friend", id));
  const groups = p.groups.filter((id) => !has("group", id));
  const handles = p.handles.filter(Boolean);
  await Promise.all(removed.map((s) => deleteShare(s.id)));
  if (friends.length || groups.length || handles.length) {
    await createShares({ itemIds: [itemId], friends, groups, handles, msg: p.msg });
  }
  return p.friends.length + p.groups.length + handles.length;
}
