import type { RequestHandler } from 'express';
import { clearAuthCookie } from '../../middleware/auth.ts';
import { toItemJson } from '../../models/Item.ts';
import { toSelf } from '../../models/User.ts';
import { getUser } from '../auth/auth.service.ts';
import * as users from './users.service.ts';

export const me: RequestHandler = async (req, res) => {
  res.json({ user: toSelf(await getUser(req.userId)) });
};

export const addCollection: RequestHandler = async (req, res) => {
  res.json(await users.addCollection(req.userId, req.body.name));
};

export const deleteCollection: RequestHandler<{ name: string }> = async (req, res) => {
  res.json(await users.deleteCollection(req.userId, req.params.name));
};

export const addType: RequestHandler = async (req, res) => {
  res.json(await users.addType(req.userId, req.body));
};

export const setShelf: RequestHandler = async (req, res) => {
  res.json(await users.setShelf(req.userId, req.body.ids));
};

export const updateProfile: RequestHandler = async (req, res) => {
  res.json({ user: toSelf(await users.updateProfile(req.userId, req.body)) });
};

export const updatePrefs: RequestHandler = async (req, res) => {
  res.json({ user: toSelf(await users.updatePrefs(req.userId, req.body)) });
};

export const exportLibrary: RequestHandler = async (req, res) => {
  const { user, items } = await users.exportLibrary(req.userId);
  res.json({ exportedAt: new Date(), user: toSelf(user), items: items.map(toItemJson) });
};

export const byHandle: RequestHandler<{ handle: string }> = async (req, res) => {
  res.json(await users.profileByHandle(req.userId, req.params.handle));
};

export const deleteAccount: RequestHandler = async (req, res) => {
  await users.deleteAccount(req.userId);
  clearAuthCookie(res);
  res.status(204).end();
};
