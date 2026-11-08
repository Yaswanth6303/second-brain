import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from './app.ts';
import { errorHandler } from './middleware/error.ts';
import { validate } from './middleware/validate.ts';

describe('app', () => {
  it('answers the health check', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(createApp()).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: 'Not found' } });
  });

  it('returns 400 with field errors when validation fails', async () => {
    const app = express().use(express.json());
    app.post('/t', validate({ body: z.object({ n: z.number() }) }), (_req, res) => {
      res.json({ ok: true });
    });
    app.use(errorHandler);
    const res = await request(app).post('/t').send({ n: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.fields.n).toBeTypeOf('string');
  });
});
