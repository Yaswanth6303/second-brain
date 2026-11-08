import bcrypt from 'bcrypt';
import { HttpError } from '../../lib/http-error.ts';
import { BUILTIN_LABELS, TYPE_ICONS } from '../../lib/types.ts';
import { Item } from '../../models/Item.ts';
import { User, type UserDoc, toPerson } from '../../models/User.ts';
import { Friendship } from '../../models/Friendship.ts';
import { Group } from '../../models/Group.ts';
import { InboxEntry } from '../../models/InboxEntry.ts';
import { Share } from '../../models/Share.ts';
import { areFriends, shelfOf } from '../friends/friends.service.ts';
import { destroy } from '../groups/groups.service.ts';
import type { PrefsInput, ProfileInput, TypeInput } from './users.schemas.ts';

async function load(userId: string): Promise<UserDoc> {
  const user = await User.findById(userId);
  if (!user) throw new HttpError(401, 'Log in to continue.');
  return user;
}

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export async function addCollection(userId: string, name: string) {
  const user = await load(userId);
  const hit = user.collections.find((c) => same(c, name));
  if (!hit) {
    user.collections.push(name);
    await user.save();
  }
  return { name: hit ?? name, collections: user.collections };
}

export async function deleteCollection(userId: string, name: string) {
  const user = await load(userId);
  // Match the stored spelling the same way addCollection does.
  const stored = user.collections.find((c) => same(c, name));
  if (stored) {
    user.collections = user.collections.filter((c) => c !== stored);
    await Promise.all([
      user.save(),
      Item.updateMany({ owner: userId, coll: stored }, { coll: '' }),
    ]);
  }
  return { collections: user.collections };
}

const pluralOf = (s: string) =>
  /s$/i.test(s) ? s : /[^aeiou]y$/i.test(s) ? s.slice(0, -1) + 'ies' : s + 's';

// Port of the prototype's addType: reuse a matching type, else create "c-<slug>".
export async function addType(userId: string, { label, icon }: TypeInput) {
  const user = await load(userId);
  const all = [
    ...Object.entries(BUILTIN_LABELS).map(([key, [l, p]]) => ({ key, label: l, plural: p })),
    ...user.customTypes,
  ];
  const hit = all.find((t) => same(t.label!, label) || same(t.plural!, label));
  if (hit) return { key: hit.key!, customTypes: user.customTypes };

  const slug =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'type';
  let key = `c-${slug}`;
  while (all.some((t) => t.key === key)) key += '-2';
  const cap = label[0]!.toUpperCase() + label.slice(1);
  user.customTypes.push({
    key,
    label: cap,
    plural: pluralOf(cap),
    icon: TYPE_ICONS.includes(icon) ? icon : 'bi-bookmark',
  });
  await user.save();
  return { key, customTypes: user.customTypes };
}

export async function setShelf(userId: string, ids: string[]) {
  const owned = await Item.countDocuments({ _id: { $in: ids }, owner: userId });
  if (new Set(ids).size !== ids.length || owned !== ids.length) {
    throw new HttpError(400, 'Only your own links can go on your shelf, once each.');
  }
  await User.updateOne({ _id: userId }, { shelf: ids });
  return { shelf: ids };
}

// A duplicate handle or email fails the save as a whole (409 from the error handler).
export async function updateProfile(userId: string, { currentPassword, ...patch }: ProfileInput) {
  const user = await load(userId);
  // A changed email could be used to reset the password, so it needs the current one.
  if (patch.email && patch.email !== user.email) {
    if (!currentPassword) {
      throw new HttpError(400, 'Enter your current password to change your email.', {
        currentPassword: 'Enter your current password to change your email.',
      });
    }
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new HttpError(400, 'That password is not right.', {
        currentPassword: 'That password is not right.',
      });
    }
  }
  user.set(patch);
  return user.save();
}

export async function updatePrefs(userId: string, patch: PrefsInput) {
  const user = await load(userId);
  for (const [k, v] of Object.entries(patch)) user.set(`prefs.${k}`, v);
  return user.save();
}

export async function exportLibrary(userId: string) {
  const [user, items] = await Promise.all([
    load(userId),
    Item.find({ owner: userId }).sort({ createdAt: -1 }),
  ]);
  return { user, items };
}

// Your own, a friend's, or a public shelf; anyone else gets the same 404 as a missing name.
export async function profileByHandle(me: string, handle: string) {
  const user = await User.findOne({ handle: handle.toLowerCase() });
  const allowed = user && (user.id === me || user.prefs!.pub || (await areFriends(me, user.id)));
  if (!allowed) throw new HttpError(404, 'Profile not found.');
  return { user: toPerson(user), since: user.createdAt, shelf: await shelfOf(user) };
}

// Removes the account and everything that points at it; other people's own links stay.
export async function deleteAccount(userId: string) {
  const user = await load(userId);
  for (const g of await Group.find({ owner: userId })) await destroy(g);
  const shares = await Share.find({ $or: [{ from: userId }, { toUser: userId }] }).distinct('_id');
  await Promise.all([
    Group.updateMany({ members: userId }, { $pull: { members: userId } }),
    Share.deleteMany({ _id: { $in: shares } }),
    Share.updateMany({ 'done.user': userId }, { $pull: { done: { user: userId } } }),
    InboxEntry.deleteMany({
      $or: [{ share: { $in: shares } }, { recipient: userId }, { from: userId }],
    }),
    Friendship.deleteMany({ $or: [{ requester: userId }, { recipient: userId }] }),
    Item.deleteMany({ owner: userId }),
  ]);
  await user.deleteOne();
}
