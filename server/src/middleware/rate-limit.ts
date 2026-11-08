import type { Request, RequestHandler } from 'express';
import { HttpError } from '../lib/http-error.ts';

// shortcut: counts live in this process's memory; use a shared store (e.g. Redis) if the API runs on several servers.
const buckets = new Map<string, { count: number; reset: number }>();

type Opts = { limit: number; windowMs: number; key: (req: Request) => string };

export function rateLimit(name: string, { limit, windowMs, key }: Opts): RequestHandler {
  return (req, _res, next) => {
    const now = Date.now();
    if (buckets.size > 10_000) for (const [k, b] of buckets) if (b.reset <= now) buckets.delete(k);
    const k = `${name}:${key(req)}`;
    const b = buckets.get(k);
    if (!b || b.reset <= now) buckets.set(k, { count: 1, reset: now + windowMs });
    else if (++b.count > limit)
      throw new HttpError(429, 'Too many attempts. Try again in a few minutes.');
    next();
  };
}

export const resetRateLimits = () => buckets.clear();

const email = (req: Request) => String(req.body?.email ?? '').toLowerCase();
const FIFTEEN_MIN = 15 * 60 * 1000;

// Per address and email for logins, so one person can't lock out everyone behind the same network.
export const loginLimit = rateLimit('login', {
  limit: 10,
  windowMs: FIFTEEN_MIN,
  key: (r) => `${r.ip}:${email(r)}`,
});
export const forgotLimit = rateLimit('forgot', { limit: 5, windowMs: FIFTEEN_MIN, key: email });
export const resetLimit = rateLimit('reset', {
  limit: 10,
  windowMs: FIFTEEN_MIN,
  key: (r) => String(r.ip),
});
