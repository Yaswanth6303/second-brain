import { Friendship } from '../../models/Friendship.ts';
import { Item } from '../../models/Item.ts';
import { User, type UserDoc } from '../../models/User.ts';
import { listEntries } from '../inbox/inbox.service.ts';
import { sentShares } from '../shares/shares.service.ts';

type Note = {
  kind: 'request' | 'inbox' | 'opened' | 'finished' | 'reminder';
  at: Date;
  text: string;
  link: string;
};

const WEEK = 7 * 86400e3;

// Built from existing data on each request; only "last seen" is stored.
export async function listNotifications(me: string) {
  const now = new Date();
  const [user, requests, inbox, sent, reminders] = await Promise.all([
    User.findById(me),
    Friendship.find({ recipient: me, status: 'pending' }).populate<{ requester: UserDoc }>(
      'requester',
      'name',
    ),
    listEntries(me, { state: 'new' }, 10),
    // Only shares something happened to can produce a notification.
    sentShares(me, { $or: [{ seen: { $ne: 'new' } }, { 'done.0': { $exists: true } }] }, 20),
    Item.find({
      owner: me,
      status: { $ne: 'done' },
      remindAt: { $ne: null, $lte: new Date(now.getTime() + WEEK) },
    })
      .sort({ remindAt: 1 })
      .limit(10),
  ]);

  const items: Note[] = [
    ...requests.map((f) => ({
      kind: 'request' as const,
      at: f.createdAt,
      text: `${f.requester.name} wants to be friends`,
      link: '/friends',
    })),
    ...inbox.map((e) => ({
      kind: 'inbox' as const,
      at: e.at,
      text: `${e.from.name} sent you ${e.title}`,
      link: '/inbox',
    })),
    ...sent.flatMap((s): Note[] => {
      const note = s.react ? ' and left a note' : '';
      if (s.kind === 'friend') {
        if (s.seen === 'new' || !s.seenAt) return [];
        const finished = s.seen === 'done';
        return [
          {
            kind: finished ? 'finished' : 'opened',
            at: s.seenAt,
            text: `${s.to.name} ${finished ? 'finished' : 'opened'} ${s.title}${finished ? note : ''}`,
            link: `/friends/${s.to.id}`,
          },
        ];
      }
      return s.done.map((d) => ({
        kind: 'finished' as const,
        at: d.at,
        text: `${d.user.name} finished ${s.title} in ${s.to.name}`,
        link: `/groups/${s.to.id}`,
      }));
    }),
    ...reminders.map((i) => ({
      kind: 'reminder' as const,
      at: i.remindAt!,
      text: `Reminder: ${i.title}`,
      link: '/library',
    })),
  ].toSorted((a, b) => b.at.getTime() - a.at.getTime());

  const seenAt = user?.notificationsSeenAt?.getTime() ?? 0;
  return {
    items: items.slice(0, 10),
    // Upcoming reminders wait until they are due before lighting the dot.
    unseen: items.some((n) => n.at.getTime() > seenAt && n.at <= now),
  };
}

export async function markSeen(me: string) {
  await User.updateOne({ _id: me }, { notificationsSeenAt: new Date() });
}
