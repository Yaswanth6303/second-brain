import { HttpError } from '../../lib/http-error.ts';
import { BUILTIN_LABELS, TYPE_ICONS } from '../../lib/types.ts';
import { Item } from '../../models/Item.ts';
import { User, type UserDoc } from '../../models/User.ts';
import type { TypeInput } from './users.schemas.ts';

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
