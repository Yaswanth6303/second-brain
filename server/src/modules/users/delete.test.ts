import { describe, expect, it } from 'vitest';
import { Friendship } from '../../models/Friendship.ts';
import { Group } from '../../models/Group.ts';
import { InboxEntry } from '../../models/InboxEntry.ts';
import { Item } from '../../models/Item.ts';
import { Share } from '../../models/Share.ts';
import { User } from '../../models/User.ts';
import { alice, bob, carol, link, makeFriends, signUp } from '../../test/helpers.ts';

describe('DELETE /api/users/me', () => {
  it('removes the account and everything that points at it', async () => {
    const a = await signUp(alice);
    const b = await signUp(bob);
    const c = await signUp(carol);
    await makeFriends(a, b);
    await makeFriends(b, c);
    await makeFriends(a, c);
    // Alice owns one group and is a member of Bob's.
    const mine = (await a.agent.post('/api/groups').send({ name: 'Mine', members: [b.id] })).body
      .group.id;
    const bobs = (await b.agent.post('/api/groups').send({ name: 'Bobs', members: [a.id, c.id] }))
      .body.group.id;
    const aItem = (await a.agent.post('/api/items').send(link)).body.item.id;
    const bItem = (await b.agent.post('/api/items').send(link)).body.item.id;
    await a.agent.post('/api/shares').send({ itemIds: [aItem], friends: [b.id], groups: [bobs] });
    await b.agent.post('/api/shares').send({ itemIds: [bItem], friends: [a.id], groups: [bobs] });
    await c.agent.post('/api/friends/requests').send({ who: 'nobody-here' });

    await a.agent.delete('/api/users/me').expect(204);

    const ref = { $or: [{ from: a.id }, { toUser: a.id }, { 'done.user': a.id }] };
    expect(await User.exists({ _id: a.id })).toBeNull();
    expect(await Item.countDocuments({ owner: a.id })).toBe(0);
    expect(await Share.countDocuments(ref)).toBe(0);
    expect(await InboxEntry.countDocuments({ $or: [{ recipient: a.id }, { from: a.id }] })).toBe(0);
    expect(
      await Friendship.countDocuments({ $or: [{ requester: a.id }, { recipient: a.id }] }),
    ).toBe(0);
    expect(await Group.exists({ _id: mine })).toBeNull();
    const left = await Group.findById(bobs);
    expect(left!.members.map(String)).toEqual([b.id, c.id]);
    // Bob's own link and its share to the group survive.
    expect(await Item.countDocuments({ owner: b.id })).toBe(1);
    expect(await Share.countDocuments({ from: b.id, kind: 'group' })).toBe(1);
    await a.agent.get('/api/auth/me').expect(401);
  });
});
