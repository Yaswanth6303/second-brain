import { isValidObjectId } from 'mongoose';
import { HttpError } from '../../lib/http-error.ts';
import type { GroupDoc } from '../../models/Group.ts';
import { InboxEntry } from '../../models/InboxEntry.ts';
import { Share, type ShareDoc } from '../../models/Share.ts';
import { type UserDoc, toPerson } from '../../models/User.ts';
import { tellsFriends } from '../shares/shares.service.ts';

type PopulatedShare = Omit<ShareDoc, 'toGroup'> & { toGroup: GroupDoc | null };

// Inbox rows for one user, newest first, without dismissed ones.
export async function listEntries(userId: string, filter: Record<string, unknown> = {}, limit = 0) {
  const rows = await InboxEntry.find({ recipient: userId, state: { $ne: 'dismissed' }, ...filter })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate<{ from: UserDoc }>('from', 'name handle bio hue')
    .populate<{ share: PopulatedShare }>({
      path: 'share',
      populate: { path: 'toGroup', select: 'name' },
    });
  return rows
    .filter((r) => r.share && r.from)
    .map((r) => ({
      id: r.id as string,
      shareId: r.share.id as string,
      from: toPerson(r.from),
      group: r.share.toGroup
        ? { id: r.share.toGroup.id as string, name: r.share.toGroup.name }
        : null,
      url: r.share.url,
      title: r.share.title,
      type: r.share.type,
      mins: r.share.mins,
      msg: r.share.msg,
      at: r.createdAt,
      state: r.state,
    }));
}

async function ownEntry(me: string, id: string) {
  const entry = isValidObjectId(id) ? await InboxEntry.findOne({ _id: id, recipient: me }) : null;
  if (!entry) throw new HttpError(404, 'Not in your inbox.');
  return entry;
}

// Following the link counts as "opened" for the sender (direct shares only).
export async function openEntry(me: string, id: string) {
  const entry = await ownEntry(me, id);
  if (!(await tellsFriends(me))) return;
  await Share.updateOne(
    { _id: entry.share, kind: 'friend', seen: 'new' },
    { seen: 'opened', seenAt: new Date() },
  );
}

export async function dismissEntry(me: string, id: string) {
  const entry = await ownEntry(me, id);
  entry.state = 'dismissed';
  await entry.save();
}
