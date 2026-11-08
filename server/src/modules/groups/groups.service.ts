import { HttpError } from '../../lib/http-error.ts';
import { Group, type GroupDoc } from '../../models/Group.ts';
import { InboxEntry } from '../../models/InboxEntry.ts';
import { Share } from '../../models/Share.ts';
import { User, type UserDoc, toPerson } from '../../models/User.ts';
import { friendIds } from '../friends/friends.service.ts';
import { memberGroup } from '../shares/shares.service.ts';
import type { GroupInput } from './groups.schemas.ts';

async function groupJson(g: GroupDoc) {
  const [members, links] = await Promise.all([
    User.find({ _id: { $in: g.members } }),
    Share.countDocuments({ toGroup: g.id }),
  ]);
  const byId = new Map(members.map((m) => [m.id as string, m]));
  return {
    id: g.id as string,
    name: g.name,
    desc: g.desc,
    owner: String(g.owner),
    // Keep the stored order: the owner first, then members as they were added.
    members: g.members
      .map((m) => byId.get(String(m)))
      .filter((m) => !!m)
      .map(toPerson),
    links,
  };
}

// New members must be the owner's friends; people already in may stay even if unfriended since.
// The owner is always in.
async function checkMembers(owner: string, members: string[], already: string[] = []) {
  const friends = new Set(await friendIds(owner));
  if (!members.every((m) => friends.has(m) || already.includes(m))) {
    throw new HttpError(400, 'Members must be your friends.', {
      members: 'Members must be your friends.',
    });
  }
  return [owner, ...new Set(members.filter((m) => m !== owner))];
}

async function ownedGroup(me: string, id: string) {
  const g = await memberGroup(me, id);
  if (String(g.owner) !== me) throw new HttpError(403, 'Only the owner can change this group.');
  return g;
}

export async function listGroups(me: string) {
  const groups = await Group.find({ members: me }).sort({ createdAt: -1 });
  return Promise.all(groups.map(groupJson));
}

export async function createGroup(me: string, input: GroupInput) {
  const members = await checkMembers(me, input.members);
  return groupJson(await Group.create({ owner: me, name: input.name, desc: input.desc, members }));
}

export async function updateGroup(me: string, id: string, patch: Partial<GroupInput>) {
  const g = await ownedGroup(me, id);
  if (patch.members) {
    const before = g.members.map(String);
    const after = await checkMembers(me, patch.members, before);
    g.set({ members: after });
    await dropInbox(
      g.id as string,
      before.filter((m) => !after.includes(m)),
    );
  }
  if (patch.name !== undefined) g.name = patch.name;
  if (patch.desc !== undefined) g.desc = patch.desc;
  await g.save();
  return groupJson(g);
}

// People who are no longer in the group stop seeing its links in their inbox.
async function dropInbox(groupId: string, people: string[]) {
  if (!people.length) return;
  const shares = await Share.find({ toGroup: groupId }).distinct('_id');
  await InboxEntry.deleteMany({ recipient: { $in: people }, share: { $in: shares } });
}

export async function destroy(g: GroupDoc) {
  const shares = await Share.find({ toGroup: g.id }).distinct('_id');
  await Promise.all([
    g.deleteOne(),
    Share.deleteMany({ _id: { $in: shares } }),
    InboxEntry.deleteMany({ share: { $in: shares } }),
  ]);
}

export async function deleteGroup(me: string, id: string) {
  await destroy(await ownedGroup(me, id));
}

// When the owner leaves, the group goes with them.
export async function leaveGroup(me: string, id: string) {
  const g = await memberGroup(me, id);
  if (String(g.owner) === me) return destroy(g);
  g.set({ members: g.members.filter((m) => String(m) !== me) });
  await g.save();
  await dropInbox(g.id as string, [me]);
}

export async function groupPage(me: string, id: string) {
  const g = await memberGroup(me, id);
  const shares = await Share.find({ toGroup: g.id })
    .sort({ createdAt: -1 })
    .populate<{ from: UserDoc | null }>('from', 'name handle bio hue')
    .populate<{ done: { user: UserDoc | null; at: Date }[] }>('done.user', 'name handle bio hue');
  const mine = await InboxEntry.find({ recipient: me, share: { $in: shares.map((s) => s.id) } });
  const savedShares = new Set(mine.filter((e) => e.state === 'saved').map((e) => String(e.share)));
  return {
    group: await groupJson(g),
    watchlist: shares
      .filter((s) => s.from)
      .map((s) => ({
        shareId: s.id as string,
        from: toPerson(s.from!),
        url: s.url,
        title: s.title,
        type: s.type,
        mins: s.mins,
        msg: s.msg,
        at: s.createdAt,
        done: s.done.filter((d) => d.user).map((d) => ({ user: toPerson(d.user!), at: d.at })),
        mine: String(s.from!.id) === me,
        saved: savedShares.has(s.id as string),
      })),
  };
}
