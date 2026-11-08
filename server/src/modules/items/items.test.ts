import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { User } from '../../models/User.ts';
import { alice, app, bob, link, signedInAgent } from '../../test/helpers.ts';

describe('items API', () => {
  it('creates an item and lists it newest first', async () => {
    const agent = await signedInAgent();
    const created = await agent.post('/api/items').send(link);
    expect(created.status).toBe(201);
    expect(created.body.item).toMatchObject({
      ...link,
      status: 'queue',
      fav: false,
      tags: [],
      mins: 0,
      coll: '',
      note: '',
      remindAt: null,
    });
    expect(created.body.item.savedAt).toBeTypeOf('string');

    await agent
      .post('/api/items')
      .send({ ...link, title: 'Second' })
      .expect(201);
    const list = await agent.get('/api/items');
    expect(list.body.items.map((i: { title: string }) => i.title)).toEqual(['Second', link.title]);
  });

  it('normalises tags and keeps at most 8', async () => {
    const agent = await signedInAgent();
    const tags = ['#Deep Work', 'deep-work', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const res = await agent.post('/api/items').send({ ...link, tags });
    expect(res.body.item.tags).toEqual(['deep-work', 'a', 'b', 'c', 'd', 'e', 'f', 'g']);
  });

  it('rejects a link that is not http(s)', async () => {
    const agent = await signedInAgent();
    const res = await agent.post('/api/items').send({ ...link, url: 'ftp://x.com/a' });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.url).toBe('Enter a full link that starts with https://');
  });

  it('rejects a type the user does not have', async () => {
    const agent = await signedInAgent();
    const res = await agent.post('/api/items').send({ ...link, type: 'c-book' });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.type).toBe('Pick a type.');
  });

  it('updates status and favourite', async () => {
    const agent = await signedInAgent();
    const { body } = await agent.post('/api/items').send(link);
    const res = await agent.patch(`/api/items/${body.item.id}`).send({ status: 'done', fav: true });
    expect(res.status).toBe(200);
    expect(res.body.item).toMatchObject({ status: 'done', fav: true, title: link.title });
  });

  it('keeps fields a partial update does not mention', async () => {
    const agent = await signedInAgent();
    await agent.post('/api/users/me/collections').send({ name: 'Career' });
    const full = {
      ...link,
      tags: ['ai'],
      mins: 19,
      note: 'Watch first',
      coll: 'Career',
      remindAt: '2026-11-10T03:30:00.000Z',
    };
    const { body } = await agent.post('/api/items').send(full);
    const res = await agent.patch(`/api/items/${body.item.id}`).send({ fav: true });
    expect(res.body.item).toMatchObject({
      fav: true,
      tags: ['ai'],
      mins: 19,
      note: 'Watch first',
      coll: 'Career',
      remindAt: '2026-11-10T03:30:00.000Z',
    });
  });

  it("hides another user's items behind 404", async () => {
    const owner = await signedInAgent();
    const { body } = await owner.post('/api/items').send(link);
    const other = await signedInAgent(bob);
    const patch = await other.patch(`/api/items/${body.item.id}`).send({ fav: true });
    expect(patch.status).toBe(404);
    expect(patch.body.error.message).toBe('Link not found.');
    await other.delete(`/api/items/${body.item.id}`).expect(404);
    expect((await other.get('/api/items')).body.items).toEqual([]);
  });

  it('removes a deleted item from the shelf', async () => {
    const agent = await signedInAgent();
    const { body } = await agent.post('/api/items').send(link);
    await User.updateOne({ email: alice.email }, { shelf: [body.item.id] });
    await agent.delete(`/api/items/${body.item.id}`).expect(204);
    const user = await User.findOne({ email: alice.email });
    expect(user!.shelf).toEqual([]);
  });

  it('requires login', async () => {
    await request(app).get('/api/items').expect(401);
  });
});
