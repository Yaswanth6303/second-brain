import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { User } from '../../models/User.ts';
import { alice, app, signedInAgent } from '../../test/helpers.ts';
import { requestReset } from './auth.service.ts';

const EXPIRED = 'This reset link has expired. Ask for a new one.';

describe('password reset', () => {
  it('answers forgot the same way for unknown emails', async () => {
    const res = await request(app).post('/api/auth/forgot').send({ email: 'nobody@example.com' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('logs a reset link for a known email', async () => {
    await signedInAgent();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await request(app).post('/api/auth/forgot').send({ email: alice.email }).expect(200);
    expect(log).toHaveBeenCalledWith(
      expect.stringMatching(/^Reset link: http:\/\/localhost:5173\/reset\/[0-9a-f]{64}$/),
    );
    log.mockRestore();
  });

  it('sets a new password, logs in, and makes the token single-use', async () => {
    await signedInAgent();
    const token = (await requestReset(alice.email))!;
    const res = await request(app).post('/api/auth/reset').send({ token, password: 'NewSecret9' });
    expect(res.status).toBe(200);
    expect(res.body.user.handle).toBe('alice');

    await request(app)
      .post('/api/auth/login')
      .send({ email: alice.email, password: alice.password })
      .expect(401);
    await request(app)
      .post('/api/auth/login')
      .send({ email: alice.email, password: 'NewSecret9' })
      .expect(200);

    const again = await request(app).post('/api/auth/reset').send({ token, password: 'Another99' });
    expect(again.status).toBe(400);
    expect(again.body.error.message).toBe(EXPIRED);
  });

  it('rejects an expired token', async () => {
    await signedInAgent();
    const token = (await requestReset(alice.email))!;
    await User.updateOne({ email: alice.email }, { resetExpires: new Date(Date.now() - 1000) });
    const res = await request(app).post('/api/auth/reset').send({ token, password: 'NewSecret9' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe(EXPIRED);
  });
});

describe('password change ends other sessions', () => {
  it('rejects cookies issued before the reset but accepts the new one', async () => {
    // Only Date is faked so the Mongo driver's timers keep working.
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      const oldSession = await signedInAgent();
      vi.setSystemTime(Date.now() + 5000);
      const token = (await requestReset(alice.email))!;
      const fresh = request.agent(app);
      await fresh.post('/api/auth/reset').send({ token, password: 'NewSecret9' }).expect(200);

      await oldSession.get('/api/auth/me').expect(401);
      await fresh.get('/api/auth/me').expect(200);
    } finally {
      vi.useRealTimers();
    }
  });
});
