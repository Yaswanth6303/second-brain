import { describe, expect, it } from 'vitest';
import { Friendship } from '../../src/models/Friendship.ts';
import { alice, bob, carol, link, makeFriends, signUp } from '../support/helpers.ts';

describe('friend requests', () => {
  it('sends by handle or email and shows on both sides', async () => {
    const a = await signUp(alice);
    const b = await signUp(bob);
    const c = await signUp(carol);
    const sent = await a.agent.post('/api/friends/requests').send({ who: '@bob' });
    expect(sent.status).toBe(201);
    expect(sent.body.user.handle).toBe('bob');
    await a.agent.post('/api/friends/requests').send({ who: 'CAROL@example.com' }).expect(201);

    const mine = (await a.agent.get('/api/friends')).body;
    expect(mine.sent.map((s: { user: { handle: string } }) => s.user.handle).toSorted()).toEqual([
      'bob',
      'carol',
    ]);
    const theirs = (await b.agent.get('/api/friends')).body;
    expect(theirs.requests).toHaveLength(1);
    expect(theirs.requests[0].user).toMatchObject({ handle: 'alice', name: 'Alice Rao' });
    expect(theirs.requests[0].user).not.toHaveProperty('email');
    void c;
  });

  it('rejects unknown people, yourself and duplicates', async () => {
    const a = await signUp(alice);
    await signUp(bob);
    const unknown = await a.agent.post('/api/friends/requests').send({ who: 'nobody' });
    expect(unknown.status).toBe(404);
    expect(unknown.body.error.message).toBe('No one with that username or email.');
    const self = await a.agent.post('/api/friends/requests').send({ who: 'alice' });
    expect(self.status).toBe(400);
    expect(self.body.error.message).toBe("That's you.");
    await a.agent.post('/api/friends/requests').send({ who: 'bob' }).expect(201);
    const again = await a.agent.post('/api/friends/requests').send({ who: 'bob' });
    expect(again.status).toBe(409);
    expect(again.body.error.message).toBe('You already sent a request.');
  });

  it('accepts automatically when the other person already asked', async () => {
    const a = await signUp(alice);
    const b = await signUp(bob);
    await a.agent.post('/api/friends/requests').send({ who: 'bob' }).expect(201);
    const back = await b.agent.post('/api/friends/requests').send({ who: 'alice' });
    expect(back.status).toBe(200);
    expect(back.body.friend).toBe(true);
    expect((await a.agent.get('/api/friends')).body.friends).toHaveLength(1);
    const dup = await a.agent.post('/api/friends/requests').send({ who: 'bob' });
    expect(dup.body.error.message).toBe('You are already friends.');
  });

  it('only the recipient can accept or decline', async () => {
    const a = await signUp(alice);
    const b = await signUp(bob);
    await a.agent.post('/api/friends/requests').send({ who: 'bob' }).expect(201);
    const id = (await b.agent.get('/api/friends')).body.requests[0].id;
    await a.agent.post(`/api/friends/requests/${id}/accept`).expect(404);
    await b.agent.post(`/api/friends/requests/${id}/decline`).expect(204);
    expect((await a.agent.get('/api/friends')).body.sent).toEqual([]);
  });

  it('lists friends with their counts', async () => {
    const a = await signUp(alice);
    const b = await signUp(bob);
    await makeFriends(a, b);
    const { friends } = (await a.agent.get('/api/friends')).body;
    expect(friends).toEqual([
      expect.objectContaining({
        user: expect.objectContaining({ handle: 'bob' }),
        sent: 0,
        done: 0,
        received: 0,
      }),
    ]);
    expect(friends[0].since).toBeTypeOf('string');
  });
});

describe('friend list order', () => {
  it('lists the oldest friendship first, as the prototype does', async () => {
    const a = await signUp(alice);
    const b = await signUp(bob);
    const c = await signUp(carol);
    // Bob is added first and Carol last, so newest-first would put Carol on top.
    await makeFriends(a, b);
    await makeFriends(a, c);
    await Friendship.updateOne(
      { requester: a.id, recipient: b.id },
      { acceptedAt: new Date('2025-01-01') },
    );
    const names = (await a.agent.get('/api/friends')).body.friends.map(
      (f: { user: { handle: string } }) => f.user.handle,
    );
    expect(names).toEqual(['bob', 'carol']);
  });
});

describe('friend page', () => {
  it('is only for friends', async () => {
    const a = await signUp(alice);
    const b = await signUp(bob);
    await a.agent.get(`/api/friends/${b.id}`).expect(404);
    await makeFriends(a, b);
    const res = await a.agent.get(`/api/friends/${b.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      user: { handle: 'bob' },
      watchlist: [],
      received: [],
      shelf: [],
    });
  });

  it('shows their shelf in order, with status and without private fields', async () => {
    const a = await signUp(alice);
    const b = await signUp(bob);
    await makeFriends(a, b);
    const one = (await b.agent.post('/api/items').send({ ...link, title: 'One' })).body.item.id;
    const two = (await b.agent.post('/api/items').send({ ...link, title: 'Two' })).body.item.id;
    await b.agent.patch(`/api/items/${one}`).send({ status: 'done' });
    await b.agent.put('/api/users/me/shelf').send({ ids: [two, one] });

    const shelf = (await a.agent.get(`/api/friends/${b.id}`)).body.shelf;
    expect(shelf.map((i: { title: string }) => i.title)).toEqual(['Two', 'One']);
    expect(shelf[1].status).toBe('done');
    expect(shelf[0]).not.toHaveProperty('note');
    expect(shelf[0]).not.toHaveProperty('tags');
  });

  it('remove ends the friendship', async () => {
    const a = await signUp(alice);
    const b = await signUp(bob);
    await makeFriends(a, b);
    await a.agent.delete(`/api/friends/${b.id}`).expect(204);
    expect((await b.agent.get('/api/friends')).body.friends).toEqual([]);
  });
});
