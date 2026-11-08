import { describe, expect, it } from 'vitest';
import { Group } from '../../models/Group.ts';
import { Share } from '../../models/Share.ts';
import { alice, bob, carol, link, makeFriends, signUp } from '../../test/helpers.ts';

// Alice shares one link with her friend Bob.
async function shared(msg = 'Watch this') {
  const a = await signUp(alice);
  const b = await signUp(bob);
  await makeFriends(a, b);
  const item = (await a.agent.post('/api/items').send(link)).body.item.id;
  const share = (await a.agent.post('/api/shares').send({ itemIds: [item], friends: [b.id], msg }))
    .body.shares[0].id;
  const entry = (await b.agent.get('/api/inbox')).body.entries[0];
  return { a, b, share, entry };
}

describe('inbox', () => {
  it('lists what friends sent', async () => {
    const { entry, share } = await shared();
    expect(entry).toMatchObject({
      shareId: share,
      title: link.title,
      msg: 'Watch this',
      state: 'new',
      group: null,
      from: { handle: 'alice', name: 'Alice Rao' },
    });
  });

  it('opening marks the share as opened for the sender', async () => {
    const { b, entry, share } = await shared();
    await b.agent.post(`/api/inbox/${entry.id}/open`).expect(204);
    expect((await Share.findById(share))!.seen).toBe('opened');
  });

  it('dismiss hides it, and only works on your own entries', async () => {
    const { a, b, entry } = await shared();
    await a.agent.post(`/api/inbox/${entry.id}/dismiss`).expect(404);
    await b.agent.post(`/api/inbox/${entry.id}/dismiss`).expect(204);
    expect((await b.agent.get('/api/inbox')).body.entries).toEqual([]);
  });
});

describe('saving a shared link', () => {
  it('adds it to the library with a from-tag and the message as note', async () => {
    const { b, share } = await shared();
    const res = await b.agent.post(`/api/shares/${share}/save`);
    expect(res.status).toBe(200);
    expect(res.body.item).toMatchObject({
      title: link.title,
      tags: ['from-alice'],
      note: 'Alice: Watch this',
      fromShare: share,
    });
    expect((await b.agent.get('/api/inbox')).body.entries[0].state).toBe('saved');
  });

  it('saving twice keeps one library item', async () => {
    const { b, share } = await shared();
    await b.agent.post(`/api/shares/${share}/save`).expect(200);
    await b.agent.post(`/api/shares/${share}/save`).expect(200);
    expect((await b.agent.get('/api/items')).body.items).toHaveLength(1);
  });

  it('the sender cannot save their own share as a recipient', async () => {
    const { a, share } = await shared();
    await a.agent.post(`/api/shares/${share}/save`).expect(404);
  });
});

describe('progress and reactions', () => {
  it('moving the saved link along updates what the sender sees', async () => {
    const { b, share } = await shared();
    const item = (await b.agent.post(`/api/shares/${share}/save`)).body.item.id;
    await b.agent.patch(`/api/items/${item}`).send({ status: 'progress' });
    expect((await Share.findById(share))!.seen).toBe('opened');
    await b.agent.patch(`/api/items/${item}`).send({ status: 'done' });
    const s = (await Share.findById(share))!;
    expect(s.seen).toBe('done');
    expect(s.seenAt).toBeInstanceOf(Date);
  });

  it('only the recipient can react', async () => {
    const { a, b, share } = await shared();
    await a.agent.patch(`/api/shares/${share}/react`).send({ react: 'Fake' }).expect(404);
    await b.agent.patch(`/api/shares/${share}/react`).send({ react: 'Loved it' }).expect(204);
    expect((await Share.findById(share))!.react).toBe('Loved it');
  });

  it('records a group member finishing once', async () => {
    const a = await signUp(alice);
    const b = await signUp(bob);
    const c = await signUp(carol);
    const g = await Group.create({ owner: a.id, name: 'Club', members: [a.id, b.id, c.id] });
    const linkId = (await a.agent.post('/api/items').send(link)).body.item.id;
    const share = (await a.agent.post('/api/shares').send({ itemIds: [linkId], groups: [g.id] }))
      .body.shares[0].id;
    const item = (await c.agent.post(`/api/shares/${share}/save`)).body.item.id;
    await c.agent.patch(`/api/items/${item}`).send({ status: 'done' });
    await c.agent.patch(`/api/items/${item}`).send({ status: 'queue' });
    await c.agent.patch(`/api/items/${item}`).send({ status: 'done' });
    const s = (await Share.findById(share))!;
    expect(s.done.map((d) => String(d.user))).toEqual([c.id]);
    expect(s.seen).toBe('new');
    // Reactions are for links a friend shared directly; a group link has no single sender to answer.
    await c.agent.patch(`/api/shares/${share}/react`).send({ react: 'Great' }).expect(404);
  });
});
