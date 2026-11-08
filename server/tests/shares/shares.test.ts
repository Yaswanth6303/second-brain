import { describe, expect, it } from 'vitest';
import { Group } from '../../src/models/Group.ts';
import { InboxEntry } from '../../src/models/InboxEntry.ts';
import { Share } from '../../src/models/Share.ts';
import { User } from '../../src/models/User.ts';
import { alice, bob, carol, link, makeFriends, signUp } from '../support/helpers.ts';

async function setup() {
  const a = await signUp(alice);
  const b = await signUp(bob);
  const c = await signUp(carol);
  const item = (await a.agent.post('/api/items').send(link)).body.item.id as string;
  return { a, b, c, item };
}

const inboxOf = (id: string) => InboxEntry.find({ recipient: id });

describe('sharing', () => {
  it("puts a link in a friend's inbox with a copy of the link", async () => {
    const { a, b, item } = await setup();
    await makeFriends(a, b);
    const res = await a.agent
      .post('/api/shares')
      .send({ itemIds: [item], friends: [b.id], msg: 'Watch this' });
    expect(res.status).toBe(201);
    expect(res.body.shares).toHaveLength(1);
    const share = await Share.findOne({ toUser: b.id });
    expect(share).toMatchObject({
      title: link.title,
      url: link.url,
      msg: 'Watch this',
      seen: 'new',
    });
    expect(await inboxOf(b.id)).toHaveLength(1);
  });

  it('reaches every other member of a group', async () => {
    const { a, b, c, item } = await setup();
    const g = await Group.create({ owner: a.id, name: 'Club', members: [a.id, b.id, c.id] });
    await a.agent
      .post('/api/shares')
      .send({ itemIds: [item], groups: [g.id] })
      .expect(201);
    expect(await inboxOf(b.id)).toHaveLength(1);
    expect(await inboxOf(c.id)).toHaveLength(1);
    expect(await inboxOf(a.id)).toHaveLength(0);
  });

  it('refuses groups you are not in', async () => {
    const { a, b, c, item } = await setup();
    const g = await Group.create({ owner: b.id, name: 'Club', members: [b.id, c.id] });
    const res = await a.agent.post('/api/shares').send({ itemIds: [item], groups: [g.id] });
    expect(res.status).toBe(404);
    expect(await inboxOf(b.id)).toHaveLength(0);
  });

  it('shares by username only when the person takes links from anyone', async () => {
    const { a, b, item } = await setup();
    const no = await a.agent.post('/api/shares').send({ itemIds: [item], handles: ['@bob'] });
    expect(no.status).toBe(404);
    expect(no.body.error.message).toBe(
      "You can't send to @bob. They may not exist, or they only take links from friends. Add them as a friend first.",
    );
    await User.updateOne({ _id: b.id }, { 'prefs.who': 'anyone' });
    await a.agent
      .post('/api/shares')
      .send({ itemIds: [item], handles: ['bob'] })
      .expect(201);
    expect(await inboxOf(b.id)).toHaveLength(1);
  });

  it('respects "nobody", even for friends', async () => {
    const { a, b, item } = await setup();
    await makeFriends(a, b);
    await User.updateOne({ _id: b.id }, { 'prefs.who': 'nobody' });
    const res = await a.agent.post('/api/shares').send({ itemIds: [item], friends: [b.id] });
    expect(res.status).toBe(403);
    expect(res.body.error.message).toBe('@bob is not taking links right now.');
    expect(await inboxOf(b.id)).toHaveLength(0);
  });

  it('does not share the same link twice to the same person', async () => {
    const { a, b, item } = await setup();
    await makeFriends(a, b);
    await a.agent.post('/api/shares').send({ itemIds: [item], friends: [b.id] });
    const again = await a.agent.post('/api/shares').send({ itemIds: [item], friends: [b.id] });
    expect(again.body.shares).toEqual([]);
    expect(await Share.countDocuments()).toBe(1);
  });

  it('two identical requests at the same moment still make one share', async () => {
    const { a, b, item } = await setup();
    await makeFriends(a, b);
    const send = () => a.agent.post('/api/shares').send({ itemIds: [item], friends: [b.id] });
    const results = await Promise.all([send(), send(), send()]);
    expect(results.map((r) => r.status)).toEqual([201, 201, 201]);
    expect(await Share.countDocuments()).toBe(1);
    expect(await inboxOf(b.id)).toHaveLength(1);
  });

  it("can't share someone else's link", async () => {
    const { a, b, item } = await setup();
    await makeFriends(a, b);
    await b.agent
      .post('/api/shares')
      .send({ itemIds: [item], friends: [a.id] })
      .expect(404);
  });
});

describe('sent shares', () => {
  it('lists what you shared, with who it went to', async () => {
    const { a, b, item } = await setup();
    await makeFriends(a, b);
    await a.agent.post('/api/shares').send({ itemIds: [item], friends: [b.id] });
    const { shares } = (await a.agent.get('/api/shares/sent')).body;
    expect(shares).toEqual([
      expect.objectContaining({
        item,
        kind: 'friend',
        seen: 'new',
        to: expect.objectContaining({ id: b.id, name: 'Bob Iyer' }),
      }),
    ]);
    expect((await b.agent.get('/api/shares/sent')).body.shares).toEqual([]);
  });

  it('only the sender can take a share back, and it leaves the inbox', async () => {
    const { a, b, item } = await setup();
    await makeFriends(a, b);
    const id = (await a.agent.post('/api/shares').send({ itemIds: [item], friends: [b.id] })).body
      .shares[0].id;
    await b.agent.delete(`/api/shares/${id}`).expect(404);
    await a.agent.delete(`/api/shares/${id}`).expect(204);
    expect(await inboxOf(b.id)).toHaveLength(0);
  });

  it('deleting the link removes it from every watchlist', async () => {
    const { a, b, item } = await setup();
    await makeFriends(a, b);
    await a.agent.post('/api/shares').send({ itemIds: [item], friends: [b.id] });
    await a.agent.delete(`/api/items/${item}`).expect(204);
    expect(await Share.countDocuments()).toBe(0);
    expect(await inboxOf(b.id)).toHaveLength(0);
  });

  it('the friend page shows the watchlist you made', async () => {
    const { a, b, item } = await setup();
    await makeFriends(a, b);
    await a.agent.post('/api/shares').send({ itemIds: [item], friends: [b.id] });
    const page = (await a.agent.get(`/api/friends/${b.id}`)).body;
    expect(page.watchlist).toEqual([
      expect.objectContaining({
        seen: 'new',
        item: expect.objectContaining({ title: link.title }),
      }),
    ]);
    const theirs = (await b.agent.get(`/api/friends/${a.id}`)).body;
    expect(theirs.received).toEqual([
      expect.objectContaining({
        title: link.title,
        from: expect.objectContaining({ handle: 'alice' }),
      }),
    ]);
  });
});

describe('removing a friend', () => {
  it('clears direct shares and inbox entries both ways', async () => {
    const { a, b, item } = await setup();
    await makeFriends(a, b);
    const theirs = (await b.agent.post('/api/items').send(link)).body.item.id;
    await a.agent.post('/api/shares').send({ itemIds: [item], friends: [b.id] });
    await b.agent.post('/api/shares').send({ itemIds: [theirs], friends: [a.id] });
    await b.agent.delete(`/api/friends/${a.id}`).expect(204);
    expect(await Share.countDocuments()).toBe(0);
    expect(await InboxEntry.countDocuments()).toBe(0);
  });
});
