import { isValidObjectId } from 'mongoose';
import { HttpError } from '../../lib/http-error.ts';
import { BUILTIN_TYPES } from '../../lib/types.ts';
import { Group, type GroupDoc } from '../../models/Group.ts';
import { InboxEntry } from '../../models/InboxEntry.ts';
import { Item } from '../../models/Item.ts';
import { Share, type ShareDoc } from '../../models/Share.ts';
import { User, type UserDoc, toPerson } from '../../models/User.ts';
import { areFriends } from '../friends/friends.service.ts';
import type { CreateSharesInput } from './shares.schemas.ts';

// Direct shares need a friendship, or a recipient who takes links from anyone. "nobody" blocks all.
async function directTarget(me: string, user: UserDoc | null, handle?: string): Promise<UserDoc> {
  // Same wording whether the account is missing or just not open to you, so it can't be probed.
  const notFound = handle
    ? `You can't send to @${handle}. They may not exist, or they only take links from friends. Add them as a friend first.`
    : 'Friend not found.';
  if (!user || user.id === me) throw new HttpError(404, notFound);
  if (user.prefs!.who === 'nobody')
    throw new HttpError(403, `@${user.handle} is not taking links right now.`);
  if (user.prefs!.who !== 'anyone' && !(await areFriends(me, user.id)))
    throw new HttpError(404, notFound);
  return user;
}

export async function memberGroup(me: string, id: string): Promise<GroupDoc> {
  const g = isValidObjectId(id) ? await Group.findOne({ _id: id, members: me }) : null;
  if (!g) throw new HttpError(404, 'Group not found.');
  return g;
}

// Creates the share unless this link already went to that recipient. The unique index
// makes this safe when two requests race; the loser just gets null.
async function createOnce(doc: Record<string, unknown>): Promise<ShareDoc | null> {
  try {
    return await Share.create(doc);
  } catch (e) {
    if ((e as { code?: number }).code === 11000) return null;
    throw e;
  }
}

export async function createShares(me: string, input: CreateSharesInput): Promise<ShareDoc[]> {
  const items = await Item.find({ _id: { $in: input.itemIds }, owner: me });
  if (items.length !== new Set(input.itemIds).size) throw new HttpError(404, 'Link not found.');

  const people = [
    ...(await Promise.all(
      input.friends.map(async (id) => directTarget(me, await User.findById(id))),
    )),
    ...(await Promise.all(
      input.handles.map(async (h) =>
        directTarget(
          me,
          await User.findOne({ handle: h.replace(/^@/, '').toLowerCase() }),
          h.replace(/^@/, ''),
        ),
      ),
    )),
  ];
  const groups = await Promise.all(input.groups.map((id) => memberGroup(me, id)));

  const created: ShareDoc[] = [];
  for (const item of items) {
    const copy = {
      item: item.id,
      from: me,
      url: item.url,
      title: item.title,
      type: item.type,
      mins: item.mins,
      msg: input.msg,
    };
    for (const user of people) {
      const share = await createOnce({ ...copy, kind: 'friend', toUser: user.id });
      if (!share) continue;
      await InboxEntry.create({ recipient: user.id, share: share.id, from: me });
      created.push(share);
    }
    for (const g of groups) {
      const share = await createOnce({ ...copy, kind: 'group', toGroup: g.id });
      if (!share) continue;
      const others = g.members.map(String).filter((m) => m !== me);
      await InboxEntry.insertMany(
        others.map((recipient) => ({ recipient, share: share.id, from: me })),
      );
      created.push(share);
    }
  }
  return created;
}

export async function sentShares(me: string, filter: Record<string, unknown> = {}, limit = 0) {
  const shares = await Share.find({ from: me, ...filter })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate<{ toUser: UserDoc | null }>('toUser', 'name handle bio hue')
    .populate<{ toGroup: GroupDoc | null }>('toGroup', 'name')
    .populate<{ done: { user: UserDoc | null; at: Date }[] }>('done.user', 'name handle bio hue');
  return shares
    .filter((s) => s.toUser || s.toGroup)
    .map((s) => ({
      id: s.id as string,
      item: String(s.item),
      title: s.title,
      kind: s.kind,
      to: s.toUser ? toPerson(s.toUser) : { id: s.toGroup!.id as string, name: s.toGroup!.name },
      seen: s.seen,
      seenAt: s.seenAt ?? null,
      done: s.done.filter((d) => d.user).map((d) => ({ user: toPerson(d.user!), at: d.at })),
      react: s.react,
      at: s.createdAt,
    }));
}

export async function deleteShare(me: string, id: string) {
  const share = isValidObjectId(id) ? await Share.findOne({ _id: id, from: me }) : null;
  if (!share) throw new HttpError(404, 'Share not found.');
  await Promise.all([share.deleteOne(), InboxEntry.deleteMany({ share: share.id })]);
}

export const shareJson = (s: ShareDoc) => ({
  id: s.id as string,
  item: String(s.item),
  kind: s.kind,
  to: String(s.toUser ?? s.toGroup),
  at: s.createdAt,
});

// "Tell friends when I open their links" (prefs.status).
export const tellsFriends = async (me: string) =>
  (await User.findById(me, { prefs: 1 }))?.prefs?.status !== false;

const isRecipient = async (me: string, s: ShareDoc) =>
  s.kind === 'friend'
    ? String(s.toUser) === me
    : String(s.from) !== me && !!(await Group.exists({ _id: s.toGroup, members: me }));

// Saves a shared link into my library (once), and marks my inbox copy as saved.
export async function saveShare(me: string, id: string) {
  const share = isValidObjectId(id) ? await Share.findById(id) : null;
  if (!share || !(await isRecipient(me, share))) throw new HttpError(404, 'Share not found.');

  let item = await Item.findOne({ owner: me, url: share.url });
  if (!item) {
    const sender = await User.findById(share.from);
    const first = (sender?.name ?? 'friend').split(' ')[0]!;
    item = await Item.create({
      owner: me,
      url: share.url,
      title: share.title,
      type: (BUILTIN_TYPES as readonly string[]).includes(share.type) ? share.type : 'article',
      mins: share.mins,
      tags: ['from-' + first.toLowerCase().replace(/[^a-z0-9]+/g, '-')],
      note: share.msg ? `${first}: ${share.msg}` : '',
      fromShare: share.id,
    });
  } else if (!item.fromShare) {
    item.set({ fromShare: share.id });
    await item.save();
  }
  await InboxEntry.updateOne(
    { recipient: me, share: share.id },
    { state: 'saved', from: share.from },
    { upsert: true },
  );
  return item;
}

// Called when a saved shared link changes status: tells the sender how far I got.
export async function recordProgress(me: string, shareId: unknown, status: string) {
  const share = await Share.findById(shareId);
  if (!share || !(await isRecipient(me, share)) || !(await tellsFriends(me))) return;
  if (share.kind === 'friend') {
    if (status === 'done') share.set({ seen: 'done', seenAt: new Date() });
    else if (status === 'progress' && share.seen === 'new')
      share.set({ seen: 'opened', seenAt: new Date() });
  } else if (status === 'done' && !share.done.some((d) => String(d.user) === me)) {
    share.done.push({ user: me, at: new Date() });
  }
  await share.save();
}

export async function reactToShare(me: string, id: string, react: string) {
  const share = isValidObjectId(id) ? await Share.findById(id) : null;
  // Only direct shares take a reaction: a group link has no single sender to answer.
  if (!share || share.kind !== 'friend' || String(share.toUser) !== me) {
    throw new HttpError(404, 'Share not found.');
  }
  share.react = react;
  await share.save();
}
