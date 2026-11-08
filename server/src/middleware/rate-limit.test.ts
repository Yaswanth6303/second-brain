import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { alice, app } from '../test/helpers.ts';

describe('rate limits', () => {
  it('stops repeated login attempts for the same email', async () => {
    const tries = [];
    for (let i = 0; i < 11; i++) {
      tries.push(
        (
          await request(app)
            .post('/api/auth/login')
            .send({ email: alice.email, password: 'wrong-pass' })
        ).status,
      );
    }
    expect(tries.slice(0, 10).every((s) => s === 401)).toBe(true);
    expect(tries[10]).toBe(429);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: alice.email, password: 'wrong-pass' });
    expect(res.body.error.message).toBe('Too many attempts. Try again in a few minutes.');
    // A different email is counted separately.
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'other@example.com', password: 'wrong-pass' })
      .expect(401);
  });

  it('limits reset-link requests', async () => {
    const codes = [];
    for (let i = 0; i < 6; i++)
      codes.push((await request(app).post('/api/auth/forgot').send({ email: alice.email })).status);
    expect(codes).toEqual([200, 200, 200, 200, 200, 429]);
  });
});
