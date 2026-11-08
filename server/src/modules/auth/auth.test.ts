import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { alice, app, signedInAgent } from '../../test/helpers.ts';

const cookieOf = (res: request.Response) =>
  ([] as string[]).concat(res.headers['set-cookie'] ?? []).join(';');

describe('POST /api/auth/signup', () => {
  it('creates the user, sets the auth cookie and hides secrets', async () => {
    const res = await request(app).post('/api/auth/signup').send(alice);
    expect(res.status).toBe(201);
    expect(cookieOf(res)).toMatch(/sb_token=.+HttpOnly/i);
    expect(res.body.user).toMatchObject({
      name: 'Alice Rao',
      handle: 'alice',
      email: 'alice@example.com',
    });
    expect(res.body.user.prefs).toEqual({
      who: 'friends',
      status: true,
      pub: false,
      digest: true,
      dust: true,
    });
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('rejects an email that differs only by case with 409', async () => {
    await request(app).post('/api/auth/signup').send(alice).expect(201);
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...alice, handle: 'alice2', email: 'Alice@Example.com' });
    expect(res.status).toBe(409);
    expect(res.body.error.fields.email).toBe('Already taken.');
  });

  it('rejects a taken handle with 409', async () => {
    await request(app).post('/api/auth/signup').send(alice).expect(201);
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...alice, email: 'other@example.com' });
    expect(res.status).toBe(409);
    expect(res.body.error.fields.handle).toBe('Already taken.');
  });

  it('lowercases the username instead of rejecting capitals', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...alice, handle: 'Alice' });
    expect(res.status).toBe(201);
    expect(res.body.user.handle).toBe('alice');
  });

  it('validates the handle format', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ ...alice, handle: 'A!' });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.handle).toBe(
      'Use 3 to 20 lowercase letters, numbers, dots or underscores.',
    );
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with the right password', async () => {
    await request(app).post('/api/auth/signup').send(alice).expect(201);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ALICE@example.com', password: alice.password });
    expect(res.status).toBe(200);
    expect(cookieOf(res)).toMatch(/sb_token=/);
  });

  it('uses a browser-session cookie when remember is off', async () => {
    await request(app).post('/api/auth/signup').send(alice).expect(201);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: alice.email, password: alice.password, remember: false });
    expect(res.status).toBe(200);
    expect(cookieOf(res)).toMatch(/sb_token=/);
    expect(cookieOf(res)).not.toMatch(/Max-Age|Expires/i);
  });

  it('gives the same 401 for a wrong password and an unknown email', async () => {
    await request(app).post('/api/auth/signup').send(alice).expect(201);
    const wrong = await request(app)
      .post('/api/auth/login')
      .send({ email: alice.email, password: 'nope-nope' });
    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ email: 'who@example.com', password: 'nope-nope' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
    expect(wrong.body.error.message).toBe('Email or password is wrong.');
  });
});

describe('session', () => {
  it('returns the current user from the cookie', async () => {
    const agent = await signedInAgent();
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user.handle).toBe('alice');
  });

  it('rejects a tampered cookie', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'sb_token=garbage');
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Log in to continue.');
  });

  it('logs out by clearing the cookie', async () => {
    const agent = await signedInAgent();
    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/auth/me').expect(401);
  });
});
