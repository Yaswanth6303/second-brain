import { Types, isValidObjectId } from 'mongoose';
import { HttpError } from '../../lib/http-error.ts';
import { Friendship, pairKey } from '../../models/Friendship.ts';
import { InboxEntry } from '../../models/InboxEntry.ts';
import { Item } from '../../models/Item.ts';
import { Share } from '../../models/Share.ts';
import { User, type UserDoc, toPerson } from '../../models/User.ts';
import { listEntries } from '../inbox/inbox.service.ts';

const other = (f: { requester: unknown; recipient: unknown }, me: string) =>
  String(f.requester) === me ? String(f.recipient) : String(f.requester);

export async function friendIds(userId: string): Promise<string[]> {
  const rows = await Friendship.find({
    status: 'accepted',
    $or: [{ requester: userId }, { recipient: userId }],
  }).lean();
  return rows.map((f) => other(f, userId));
}

export async function areFriends(a: string, b: string): Promise<boolean> {
  return !!(await Friendship.exists({ pair: pairKey(a, b), status: 'accepted' }));
}

// "@handle", "handle" or an email address.
async function findPerson(who: string): Promise<UserDoc | null> {
  const w = who.trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+$/.test(w)
    ? User.findOne({ email: w })
    : User.findOne({ handle: w.replace(/^@/, '') });
}

export async function sendRequest(me: string, who: string) {
  const them = await findPerson(who);
  if (!them) throw new HttpError(404, 'No one with that username or email.');
  if (them.id === me) throw new HttpError(400, "That's you.");
  const existing = await Friendship.findOne({ pair: pairKey(me, them.id) });
  if (existing?.status === 'accepted') throw new HttpError(409, 'You are already friends.');
  if (existing && String(existing.requester) === me)
    throw new HttpError(409, 'You already sent a request.');
  if (existing) {
    // They already asked us: asking back means yes.
    existing.set({ status: 'accepted', acceptedAt: new Date() });
    await existing.save();
    return { accepted: true as const, user: toPerson(them) };
  }
  const f = await Friendship.create({
    requester: me,
    recipient: them.id,
    pair: pairKey(me, them.id),
  });
  return { accepted: false as const, id: f.id as string, user: toPerson(them) };
}

async function pendingFor(me: string, id: string) {
  const f = isValidObjectId(id)
    ? await Friendship.findOne({ _id: id, recipient: me, status: 'pending' })
    : null;
  if (!f) throw new HttpError(404, 'Request not found.');
  return f;
}

export async function acceptRequest(me: string, id: string) {
  const f = await pendingFor(me, id);
  f.set({ status: 'accepted', acceptedAt: new Date() });
  await f.save();
  return toPerson((await User.findById(f.requester))!);
}

export async function declineRequest(me: string, id: string) {
  await (await pendingFor(me, id)).deleteOne();
}

export async function listFriends(me: string) {
  const rows = await Friendship.find({ $or: [{ requester: me }, { recipient: me }] })
    .sort({ createdAt: -1 })
    .populate<{ requester: UserDoc; recipient: UserDoc }>(['requester', 'recipient']);
  const them = (f: (typeof rows)[number]) =>
    toPerson(String(f.requester.id) === me ? f.recipient : f.requester);

  // Two grouped queries for every friend's counts, instead of three queries per friend.
  const meId = new Types.ObjectId(me);
  const [sentAgg, receivedAgg] = await Promise.all([
    Share.aggregate<{ user: unknown; sent: number; done: number }>([
      { $match: { from: meId, kind: 'friend' } },
      {
        $group: {
          _id: '$toUser',
          sent: { $sum: 1 },
          done: { $sum: { $cond: [{ $eq: ['$seen', 'done'] }, 1, 0] } },
        },
      },
      { $project: { _id: 0, user: '$_id', sent: 1, done: 1 } },
    ]),
    InboxEntry.aggregate<{ user: unknown; n: number }>([
      { $match: { recipient: meId, state: { $ne: 'dismissed' } } },
      { $group: { _id: '$from', n: { $sum: 1 } } },
      { $project: { _id: 0, user: '$_id', n: 1 } },
    ]),
  ]);
  const sentBy = new Map(sentAgg.map((r) => [String(r.user), r]));
  const receivedBy = new Map(receivedAgg.map((r) => [String(r.user), r.n]));
  const friends = rows
    .filter((f) => f.status === 'accepted')
    .map((f) => {
      const user = them(f);
      const s = sentBy.get(user.id);
      return {
        user,
        since: f.acceptedAt ?? f.createdAt,
        sent: s?.sent ?? 0,
        done: s?.done ?? 0,
        received: receivedBy.get(user.id) ?? 0,
      };
    });
  const pending = rows.filter((f) => f.status === 'pending');
  return {
    // Oldest friendship first, like the prototype's list.
    friends: friends.toSorted((a, b) => +a.since - +b.since),
    requests: pending
      .filter((f) => String(f.recipient.id) === me)
      .map((f) => ({ id: f.id as string, user: them(f) })),
    sent: pending
      .filter((f) => String(f.requester.id) === me)
      .map((f) => ({ id: f.id as string, user: them(f) })),
  };
}

// Ends the friendship and everything shared directly between the two, both ways.
export async function removeFriend(me: string, them: string) {
  const f = isValidObjectId(them)
    ? await Friendship.findOne({ pair: pairKey(me, them), status: 'accepted' })
    : null;
  if (!f) throw new HttpError(404, 'Friend not found.');
  await f.deleteOne();
  const shares = await Share.find({
    kind: 'friend',
    $or: [
      { from: me, toUser: them },
      { from: them, toUser: me },
    ],
  }).distinct('_id');
  await Promise.all([
    Share.deleteMany({ _id: { $in: shares } }),
    InboxEntry.deleteMany({ share: { $in: shares } }),
  ]);
}

export async function friendPage(me: string, them: string) {
  if (!isValidObjectId(them) || !(await areFriends(me, them)))
    throw new HttpError(404, 'Friend not found.');
  const [user, f, watchlist, received] = await Promise.all([
    User.findById(them),
    Friendship.findOne({ pair: pairKey(me, them) }),
    Share.find({ from: me, kind: 'friend', toUser: them }).sort({ createdAt: -1 }),
    listEntries(me, { from: them }),
  ]);
  return {
    user: toPerson(user!),
    since: f!.acceptedAt ?? f!.createdAt,
    watchlist: watchlist.map((s) => ({
      id: s.id as string,
      item: { url: s.url, title: s.title, type: s.type, mins: s.mins },
      at: s.createdAt,
      seen: s.seen,
      react: s.react,
    })),
    received,
    shelf: await shelfOf(user!),
  };
}

// Only the links someone chose to show, in their order, without notes or tags.
export async function shelfOf(user: UserDoc) {
  const items = await Item.find({ _id: { $in: user.shelf }, owner: user.id });
  const byId = new Map(items.map((i) => [i.id as string, i]));
  return user.shelf
    .map((id) => byId.get(String(id)))
    .filter((i) => !!i)
    .map((i) => ({
      id: i.id as string,
      url: i.url,
      title: i.title,
      type: i.type,
      mins: i.mins,
      fav: i.fav,
      status: i.status,
      savedAt: i.createdAt,
    }));
}
