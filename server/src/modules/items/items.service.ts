import { isValidObjectId } from 'mongoose';
import { HttpError } from '../../lib/http-error.ts';
import { BUILTIN_TYPES } from '../../lib/types.ts';
import { InboxEntry } from '../../models/InboxEntry.ts';
import { Item, type ItemDoc } from '../../models/Item.ts';
import { Share } from '../../models/Share.ts';
import { User } from '../../models/User.ts';
import { recordProgress } from '../shares/shares.service.ts';
import type { CreateItemInput, UpdateItemInput } from './items.schemas.ts';

async function assertType(userId: string, type: string) {
  if ((BUILTIN_TYPES as readonly string[]).includes(type)) return;
  const user = await User.findById(userId, { customTypes: 1 }).lean();
  if (!user?.customTypes.some((t) => t.key === type)) {
    throw new HttpError(400, 'Pick a type.', { type: 'Pick a type.' });
  }
}

export function listItems(userId: string): Promise<ItemDoc[]> {
  return Item.find({ owner: userId }).sort({ createdAt: -1, _id: -1 });
}

export async function createItem(userId: string, input: CreateItemInput): Promise<ItemDoc> {
  await assertType(userId, input.type);
  return Item.create({ ...input, owner: userId });
}

// Other users' ids get the same 404 as missing ones, so ids can't be probed.
async function ownItem(userId: string, id: string): Promise<ItemDoc> {
  const item = isValidObjectId(id) ? await Item.findOne({ _id: id, owner: userId }) : null;
  if (!item) throw new HttpError(404, 'Link not found.');
  return item;
}

export async function updateItem(
  userId: string,
  id: string,
  patch: UpdateItemInput,
): Promise<ItemDoc> {
  const item = await ownItem(userId, id);
  if (patch.type) await assertType(userId, patch.type);
  const statusChanged = patch.status && patch.status !== item.status;
  item.set(patch);
  await item.save();
  if (statusChanged && item.fromShare) await recordProgress(userId, item.fromShare, item.status);
  return item;
}

export async function deleteItem(userId: string, id: string): Promise<void> {
  const item = await ownItem(userId, id);
  // The link also leaves every watchlist and inbox it was shared to.
  const shares = await Share.find({ item: item.id }).distinct('_id');
  await Promise.all([
    item.deleteOne(),
    User.updateOne({ _id: userId }, { $pull: { shelf: item.id } }),
    Share.deleteMany({ _id: { $in: shares } }),
    InboxEntry.deleteMany({ share: { $in: shares } }),
  ]);
}
