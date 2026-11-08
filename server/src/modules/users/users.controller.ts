import type { RequestHandler } from 'express';
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
