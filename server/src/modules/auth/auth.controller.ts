import type { RequestHandler } from 'express';
import { clearAuthCookie, setAuthCookie } from '../../middleware/auth.ts';
import { env } from '../../config/env.ts';
import { toPublicUser } from '../../models/User.ts';
import * as auth from './auth.service.ts';

export const signup: RequestHandler = async (req, res) => {
  const user = await auth.signup(req.body);
  setAuthCookie(res, user.id);
  res.status(201).json({ user: toPublicUser(user) });
};

export const login: RequestHandler = async (req, res) => {
  const user = await auth.login(req.body);
  setAuthCookie(res, user.id, req.body.remember);
  res.json({ user: toPublicUser(user) });
};

export const logout: RequestHandler = (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
};

export const me: RequestHandler = async (req, res) => {
  res.json({ user: toPublicUser(await auth.getUser(req.userId)) });
};

export const forgot: RequestHandler = async (req, res) => {
  const token = await auth.requestReset(req.body.email);
  // No email delivery in this project: the link goes to the server console.
  if (token) console.log(`Reset link: ${env.CLIENT_ORIGIN}/reset/${token}`);
  res.json({ ok: true });
};

export const reset: RequestHandler = async (req, res) => {
  const user = await auth.resetPassword(req.body);
  setAuthCookie(res, user.id);
  res.json({ user: toPublicUser(user) });
};
