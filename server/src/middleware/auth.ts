import type { RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';
import { HttpError } from '../lib/http-error.ts';
import { User } from '../models/User.ts';

declare module 'express-serve-static-core' {
  interface Request {
    userId: string;
  }
}

const COOKIE = 'sb_token';
const WEEK_MS = 7 * 24 * 3600 * 1000;

export function setAuthCookie(res: Response, userId: string, remember = true) {
  const token = jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
    // Without maxAge the browser drops the cookie when it closes.
    maxAge: remember ? WEEK_MS : undefined,
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE, { httpOnly: true, sameSite: 'lax', secure: env.isProd });
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  let payload: { sub: string; iat: number };
  try {
    payload = jwt.verify(req.cookies?.[COOKIE] ?? '', env.JWT_SECRET) as {
      sub: string;
      iat: number;
    };
  } catch {
    throw new HttpError(401, 'Log in to continue.');
  }
  // iat has whole-second precision, so compare in seconds.
  const user = await User.findById(payload.sub, { passwordChangedAt: 1 }).lean();
  const changedAt = user?.passwordChangedAt
    ? Math.floor(user.passwordChangedAt.getTime() / 1000)
    : 0;
  if (!user || payload.iat < changedAt) throw new HttpError(401, 'Log in to continue.');
  req.userId = payload.sub;
  next();
};
