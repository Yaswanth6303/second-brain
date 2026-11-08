import { describe, expect, it } from 'vitest';
import { InboxEntry } from '../../src/models/InboxEntry.ts';
import { Share } from '../../src/models/Share.ts';
import { alice, bob, carol, link, makeFriends, signUp } from '../support/helpers.ts';

// Alice is friends with Bob and Carol; Bob and Carol are not friends.
async function people() {
  const a = await signUp(alice);
  const b = await signUp(bob);
  const c = await signUp(carol);
  await makeFriends(a, b);
  await makeFriends(a, c);
  return { a, b, c };
}

async function club() {
  const p = await people();
  const res = await p.a.agent
    .post('/api/groups')
    .send({ name: 'Club', desc: 'Weekend talks', members: [p.b.id, p.c.id] });
  return { ...p, group: res.body.group.id as string, res };
}

describe('groups', () => {
  it('creates a group with the owner and friends in it', async () => {
    const { res, a } = await club();
    expect(res.status).toBe(201);
    expect(res.body.group).toMatchObject({
      name: 'Club',
      desc: 'Weekend talks',
      owner: a.id,
      links: 0,
    });
    expect(res.body.group.members.map((m: { handle: string }) => m.handle)).toEqual([
      'alice',
      'bob',
      'carol',
    ]);
  });

  it('needs at least one member, all of them friends', async () => {
    const { a, b, c } = await people();
    const none = await a.agent.post('/api/groups').send({ name: 'Solo', members: [] });
    expect(none.status).toBe(400);
    expect(none.body.error.fields.members).toBe('Pick at least one member.');
    const stranger = await b.agent.post('/api/groups').send({ name: 'X', members: [c.id] });
    expect(stranger.status).toBe(400);
  });

  it('members see the group and its watchlist; outsiders get 404', async () => {
    const { a, b, group } = await club();
    const item = (await a.agent.post('/api/items').send(link)).body.item.id;
    await b.agent.post('/api/items').send(link);
    await a.agent.post('/api/shares').send({ itemIds: [item], groups: [group], msg: 'Saturday' });

    const page = (await b.agent.get(`/api/groups/${group}`)).body;
    expect(page.group.name).toBe('Club');
    expect(page.watchlist).toEqual([
      expect.objectContaining({
        title: link.title,
        msg: 'Saturday',
        mine: false,
        saved: false,
        done: [],
      }),
    ]);
    expect((await b.agent.get('/api/groups')).body.groups[0].links).toBe(1);

    const d = await signUp({ ...alice, handle: 'dan', email: 'dan@example.com', name: 'Dan' });
    await d.agent.get(`/api/groups/${group}`).expect(404);
  });

  it('only the owner can edit or delete', async () => {
    const { a, b, c, group } = await club();
    const edit = await b.agent.patch(`/api/groups/${group}`).send({ name: 'Mine now' });
    expect(edit.status).toBe(403);
    expect(edit.body.error.message).toBe('Only the owner can change this group.');
    await b.agent.delete(`/api/groups/${group}`).expect(403);
    const ok = await a.agent
      .patch(`/api/groups/${group}`)
      .send({ name: 'Talk Club', members: [b.id] });
    expect(ok.body.group.name).toBe('Talk Club');
    expect(ok.body.group.members.map((m: { id: string }) => m.id)).toEqual([a.id, b.id]);
    await c.agent.get(`/api/groups/${group}`).expect(404);
  });

  it('a member can leave; the owner leaving deletes the group and its watchlist', async () => {
    const { a, b, c, group } = await club();
    await c.agent.post(`/api/groups/${group}/leave`).expect(204);
    expect((await c.agent.get('/api/groups')).body.groups).toEqual([]);
    const item = (await a.agent.post('/api/items').send(link)).body.item.id;
    await a.agent.post('/api/shares').send({ itemIds: [item], groups: [group] });
    await a.agent.post(`/api/groups/${group}/leave`).expect(204);
    await b.agent.get(`/api/groups/${group}`).expect(404);
    expect(await Share.countDocuments()).toBe(0);
    expect(await InboxEntry.countDocuments()).toBe(0);
  });

  it("people who leave or are removed lose the group's links from their inbox", async () => {
    const { a, b, c, group } = await club();
    const item = (await a.agent.post('/api/items').send(link)).body.item.id;
    await a.agent.post('/api/shares').send({ itemIds: [item], groups: [group] });
    await c.agent.post(`/api/groups/${group}/leave`).expect(204);
    expect((await c.agent.get('/api/inbox')).body.entries).toEqual([]);
    await a.agent.patch(`/api/groups/${group}`).send({ members: [] }).expect(400);
    await signUp({ ...alice, handle: 'dan', email: 'dan@example.com', name: 'Dan' }).then(
      async (d) => {
        await makeFriends(a, d);
        await a.agent
          .patch(`/api/groups/${group}`)
          .send({ members: [d.id] })
          .expect(200);
      },
    );
    expect((await b.agent.get('/api/inbox')).body.entries).toEqual([]);
  });

  it('the owner can still edit after unfriending a member', async () => {
    const { a, b, c, group } = await club();
    await a.agent.delete(`/api/friends/${c.id}`).expect(204);
    const res = await a.agent
      .patch(`/api/groups/${group}`)
      .send({ name: 'Renamed', members: [b.id, c.id] });
    expect(res.status).toBe(200);
    expect(res.body.group.members.map((m: { id: string }) => m.id)).toEqual([a.id, b.id, c.id]);
  });
});
