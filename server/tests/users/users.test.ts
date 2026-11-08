import { describe, expect, it } from 'vitest';
import { bob, link, signedInAgent } from '../support/helpers.ts';

describe('users/me', () => {
  it('returns the private profile with shelf, collections and custom types', async () => {
    const agent = await signedInAgent();
    const res = await agent.get('/api/users/me');
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      handle: 'alice',
      shelf: [],
      collections: [],
      customTypes: [],
    });
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('also returns it from login', async () => {
    const agent = await signedInAgent();
    expect((await agent.get('/api/auth/me')).body.user.collections).toEqual([]);
  });
});

describe('collections', () => {
  it('reuses a collection that differs only by case', async () => {
    const agent = await signedInAgent();
    await agent.post('/api/users/me/collections').send({ name: 'Weekend  Reads' }).expect(200);
    const res = await agent.post('/api/users/me/collections').send({ name: 'weekend reads' });
    expect(res.body).toEqual({ name: 'Weekend Reads', collections: ['Weekend Reads'] });
  });

  it('deleting a collection clears it from items', async () => {
    const agent = await signedInAgent();
    await agent.post('/api/users/me/collections').send({ name: 'Career' });
    const { body } = await agent.post('/api/items').send({ ...link, coll: 'Career' });
    const res = await agent.delete('/api/users/me/collections/Career');
    expect(res.body.collections).toEqual([]);
    const items = (await agent.get('/api/items')).body.items;
    expect(items.find((i: { id: string }) => i.id === body.item.id).coll).toBe('');
  });
  it('deletes a collection whatever its capitalisation, including odd characters', async () => {
    const agent = await signedInAgent();
    await agent.post('/api/users/me/collections').send({ name: 'Reads / 100%' });
    const { body } = await agent.post('/api/items').send({ ...link, coll: 'Reads / 100%' });
    const res = await agent.delete(
      `/api/users/me/collections/${encodeURIComponent('reads / 100%')}`,
    );
    expect(res.body.collections).toEqual([]);
    const items = (await agent.get('/api/items')).body.items;
    expect(items.find((i: { id: string }) => i.id === body.item.id).coll).toBe('');
  });
});

describe('custom types', () => {
  it.each([
    ['Book', 'c-book', 'Books'],
    ['story', 'c-story', 'Stories'],
    ['News', 'c-news', 'News'],
  ])('%s → %s / %s', async (label, key, plural) => {
    const agent = await signedInAgent();
    const res = await agent.post('/api/users/me/types').send({ label, icon: 'bi-book' });
    expect(res.body.key).toBe(key);
    expect(res.body.customTypes).toContainEqual({
      key,
      label: label[0]!.toUpperCase() + label.slice(1),
      plural,
      icon: 'bi-book',
    });
  });

  it('reuses existing built-in and custom types by label or plural', async () => {
    const agent = await signedInAgent();
    expect(
      (await agent.post('/api/users/me/types').send({ label: 'Videos', icon: 'bi-book' })).body.key,
    ).toBe('video');
    await agent.post('/api/users/me/types').send({ label: 'Book', icon: 'bi-book' });
    const again = await agent.post('/api/users/me/types').send({ label: 'books', icon: 'bi-cart' });
    expect(again.body.key).toBe('c-book');
    expect(again.body.customTypes).toHaveLength(1);
  });

  it('falls back to the bookmark icon and lets items use the new type', async () => {
    const agent = await signedInAgent();
    const res = await agent.post('/api/users/me/types').send({ label: 'Thread', icon: 'bi-skull' });
    expect(res.body.customTypes[0].icon).toBe('bi-bookmark');
    await agent
      .post('/api/items')
      .send({ ...link, type: 'c-thread' })
      .expect(201);
  });
});

describe('shelf', () => {
  it('saves the order of your own items', async () => {
    const agent = await signedInAgent();
    const a = (await agent.post('/api/items').send(link)).body.item.id;
    const b = (await agent.post('/api/items').send(link)).body.item.id;
    const res = await agent.put('/api/users/me/shelf').send({ ids: [b, a] });
    expect(res.status).toBe(200);
    expect(res.body.shelf).toEqual([b, a]);
  });

  it("rejects someone else's item or a duplicate", async () => {
    const other = await signedInAgent(bob);
    const theirs = (await other.post('/api/items').send(link)).body.item.id;
    const agent = await signedInAgent();
    const mine = (await agent.post('/api/items').send(link)).body.item.id;
    await agent
      .put('/api/users/me/shelf')
      .send({ ids: [theirs] })
      .expect(400);
    await agent
      .put('/api/users/me/shelf')
      .send({ ids: [mine, mine] })
      .expect(400);
  });
});
