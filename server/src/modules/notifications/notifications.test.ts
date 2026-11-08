import { describe, expect, it } from 'vitest';
import { alice, bob, link, makeFriends, signUp } from '../../test/helpers.ts';

describe('notifications', () => {
  it('lists friend requests and new links, and clears the dot once seen', async () => {
    const a = await signUp(alice);
    const b = await signUp(bob);
    await a.agent.post('/api/friends/requests').send({ who: 'bob' });
    let n = (await b.agent.get('/api/notifications')).body;
    expect(n.unseen).toBe(true);
    expect(n.items[0]).toMatchObject({
      kind: 'request',
      text: 'Alice Rao wants to be friends',
      link: '/friends',
    });

    await b.agent.post('/api/notifications/seen').expect(204);
    expect((await b.agent.get('/api/notifications')).body.unseen).toBe(false);

    const id = (await b.agent.get('/api/friends')).body.requests[0].id;
    await b.agent.post(`/api/friends/requests/${id}/accept`);
    const item = (await a.agent.post('/api/items').send(link)).body.item.id;
    await a.agent.post('/api/shares').send({ itemIds: [item], friends: [b.id] });
    n = (await b.agent.get('/api/notifications')).body;
    expect(n.unseen).toBe(true);
    expect(n.items[0]).toMatchObject({
      kind: 'inbox',
      text: `Alice Rao sent you ${link.title}`,
      link: '/inbox',
    });
  });

  it('tells the sender when a friend finished, and shows due reminders', async () => {
    const a = await signUp(alice);
    const b = await signUp(bob);
    await makeFriends(a, b);
    const item = (
      await a.agent
        .post('/api/items')
        .send({ ...link, remindAt: new Date(Date.now() - 60e3).toISOString() })
    ).body.item.id;
    const share = (await a.agent.post('/api/shares').send({ itemIds: [item], friends: [b.id] }))
      .body.shares[0].id;
    const saved = (await b.agent.post(`/api/shares/${share}/save`)).body.item.id;
    await b.agent.patch(`/api/items/${saved}`).send({ status: 'done' });
    await b.agent.patch(`/api/shares/${share}/react`).send({ react: 'Loved it' });

    const kinds = (await a.agent.get('/api/notifications')).body.items.map(
      (i: { kind: string; text: string }) => `${i.kind}: ${i.text}`,
    );
    expect(kinds).toContain(`finished: Bob Iyer finished ${link.title} and left a note`);
    expect(kinds).toContain(`reminder: Reminder: ${link.title}`);
  });
});
