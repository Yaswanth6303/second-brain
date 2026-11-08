import { describe, expect, it } from 'vitest';
import { Share } from '../../models/Share.ts';
import { alice, bob, carol, link, makeFriends, signUp } from '../../test/helpers.ts';

describe('profile', () => {
  it('saves name, handle, bio and card colour', async () => {
    const a = await signUp(alice);
    const res = await a.agent
      .patch('/api/users/me')
      .send({ name: 'Alice R', handle: 'ali', bio: 'Reads a lot.', hue: 212 });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      name: 'Alice R',
      handle: 'ali',
      bio: 'Reads a lot.',
      hue: 212,
    });
  });

  it('refuses a taken username and saves nothing', async () => {
    const a = await signUp(alice);
    await signUp(bob);
    const res = await a.agent.patch('/api/users/me').send({ name: 'Changed', handle: 'bob' });
    expect(res.status).toBe(409);
    expect(res.body.error.fields.handle).toBe('Already taken.');
    expect((await a.agent.get('/api/users/me')).body.user.name).toBe('Alice Rao');
  });

  it('saves a profile that sends back whatever colour the account already has', async () => {
    const a = await signUp(alice);
    const me = (await a.agent.get('/api/users/me')).body.user;
    const res = await a.agent.patch('/api/users/me').send({ name: 'Alice R', hue: me.hue });
    expect(res.status).toBe(200);
    await a.agent.patch('/api/users/me').send({ hue: 97 }).expect(200);
    await a.agent.patch('/api/users/me').send({ hue: 400 }).expect(400);
  });

  it('starts new accounts on one of the six card colours', async () => {
    const a = await signUp(alice);
    const { hue } = (await a.agent.get('/api/users/me')).body.user;
    expect([168, 212, 262, 330, 12, 38]).toContain(hue);
  });

  it('asks for the current password to change the email', async () => {
    const a = await signUp(alice);
    const none = await a.agent.patch('/api/users/me').send({ email: 'new@example.com' });
    expect(none.status).toBe(400);
    expect(none.body.error.fields.currentPassword).toBe(
      'Enter your current password to change your email.',
    );
    const wrong = await a.agent
      .patch('/api/users/me')
      .send({ email: 'new@example.com', currentPassword: 'nope-nope' });
    expect(wrong.status).toBe(400);
    expect(wrong.body.error.fields.currentPassword).toBe('That password is not right.');
    const ok = await a.agent
      .patch('/api/users/me')
      .send({ email: 'new@example.com', currentPassword: alice.password });
    expect(ok.body.user.email).toBe('new@example.com');
    // Sending the same email back is not a change and needs no password.
    await a.agent
      .patch('/api/users/me')
      .send({ name: 'Alice', email: 'NEW@example.com' })
      .expect(200);
  });

  it('saves settings', async () => {
    const a = await signUp(alice);
    const res = await a.agent
      .patch('/api/users/me/prefs')
      .send({ who: 'anyone', pub: true, dust: false });
    expect(res.body.user.prefs).toEqual({
      who: 'anyone',
      status: true,
      pub: true,
      digest: true,
      dust: false,
    });
  });

  it('exports the library', async () => {
    const a = await signUp(alice);
    await a.agent.post('/api/items').send(link);
    const res = await a.agent.get('/api/users/me/export');
    expect(res.body.user.handle).toBe('alice');
    expect(res.body.items).toHaveLength(1);
    expect(res.body.exportedAt).toBeTypeOf('string');
  });
});

describe('"Tell friends when I open their links" off', () => {
  it('keeps the sender from seeing opened or finished', async () => {
    const a = await signUp(alice);
    const b = await signUp(bob);
    await makeFriends(a, b);
    await b.agent.patch('/api/users/me/prefs').send({ status: false });
    const item = (await a.agent.post('/api/items').send(link)).body.item.id;
    const share = (await a.agent.post('/api/shares').send({ itemIds: [item], friends: [b.id] }))
      .body.shares[0].id;
    const entry = (await b.agent.get('/api/inbox')).body.entries[0].id;
    await b.agent.post(`/api/inbox/${entry}/open`).expect(204);
    const saved = (await b.agent.post(`/api/shares/${share}/save`)).body.item.id;
    await b.agent.patch(`/api/items/${saved}`).send({ status: 'done' });
    expect((await Share.findById(share))!.seen).toBe('new');
  });
});

async function withShelf() {
  const a = await signUp(alice);
  const id = (await a.agent.post('/api/items').send(link)).body.item.id;
  await a.agent.put('/api/users/me/shelf').send({ ids: [id] });
  return a;
}

describe('profile pages', () => {
  it("shows your own and a friend's shelf", async () => {
    const a = await withShelf();
    const b = await signUp(bob);
    expect((await a.agent.get('/api/users/alice')).body.shelf).toHaveLength(1);
    await makeFriends(a, b);
    const res = await b.agent.get('/api/users/alice');
    expect(res.body.user).toMatchObject({ handle: 'alice' });
    expect(res.body.user).not.toHaveProperty('email');
    expect(res.body.shelf[0]).toMatchObject({ title: link.title, status: 'queue' });
  });

  it('is 404 for strangers unless the shelf is public', async () => {
    const a = await withShelf();
    const c = await signUp(carol);
    const hidden = await c.agent.get('/api/users/alice');
    expect(hidden.status).toBe(404);
    expect(hidden.body).toEqual({ error: { message: 'Profile not found.' } });
    await a.agent.patch('/api/users/me/prefs').send({ pub: true });
    expect((await c.agent.get('/api/users/alice')).body.shelf).toHaveLength(1);
    expect((await c.agent.get('/api/users/nobody')).status).toBe(404);
  });
});
