import { describe, expect, it } from 'vitest';
import { Group } from '../src/models/Group.ts';
import { InboxEntry } from '../src/models/InboxEntry.ts';
import { Item } from '../src/models/Item.ts';
import { Share } from '../src/models/Share.ts';
import { User } from '../src/models/User.ts';
import { DEMO_HANDLES, seed } from '../src/seed.ts';
import { alice, signUp } from './support/helpers.ts';

const counts = async () => ({
  users: await User.countDocuments(),
  items: await Item.countDocuments(),
  shares: await Share.countDocuments(),
  inbox: await InboxEntry.countDocuments(),
  groups: await Group.countDocuments(),
});

describe('seed', () => {
  it('creates the demo world and can run again without duplicating it', async () => {
    const a = await signUp(alice);
    const mine = (
      await a.agent
        .post('/api/items')
        .send({ url: 'https://x.com/a', title: 'Mine', type: 'article' })
    ).body.item.id;

    await seed();
    const first = await counts();
    await seed();
    expect(await counts()).toEqual(first);

    for (const handle of DEMO_HANDLES) expect(await User.countDocuments({ handle })).toBe(1);
    expect(await Item.exists({ _id: mine })).not.toBeNull();
    const aarav = await User.findOne({ handle: 'aarav' });
    expect(await Item.countDocuments({ owner: aarav!.id })).toBeGreaterThanOrEqual(13);
    expect(aarav!.shelf).toHaveLength(5);
    expect(await Group.countDocuments({ owner: aarav!.id })).toBe(2);
    expect(await InboxEntry.countDocuments({ recipient: aarav!.id })).toBe(5);
  });

  it('lets the demo user log in', async () => {
    await seed();
    const { app } = await import('./support/helpers.ts');
    const { default: request } = await import('supertest');
    const { DEMO_PASSWORD } = await import('../src/seed.ts');
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'aarav@example.com', password: DEMO_PASSWORD })
      .expect(200);
  });

  it('refuses to run when a real account uses a demo username or email', async () => {
    const real = await signUp({ ...alice, handle: 'devm', email: 'someone@example.com' });
    await real.agent
      .post('/api/items')
      .send({ url: 'https://x.com/a', title: 'Mine', type: 'article' });
    await expect(seed()).rejects.toThrow(/devm/);
    expect(await User.countDocuments()).toBe(1);
    expect(await Item.countDocuments({ owner: real.id })).toBe(1);
  });
});
