import type { RequestHandler } from 'express';
import * as friends from './friends.service.ts';

type Id = { id: string };

export const list: RequestHandler = async (req, res) => {
  res.json(await friends.listFriends(req.userId));
};

export const request: RequestHandler = async (req, res) => {
  const r = await friends.sendRequest(req.userId, req.body.who);
  if (r.accepted) res.json({ friend: true, user: r.user });
  else res.status(201).json({ id: r.id, user: r.user });
};

export const accept: RequestHandler<Id> = async (req, res) => {
  res.json({ friend: true, user: await friends.acceptRequest(req.userId, req.params.id) });
};

export const decline: RequestHandler<Id> = async (req, res) => {
  await friends.declineRequest(req.userId, req.params.id);
  res.status(204).end();
};

export const page: RequestHandler<Id> = async (req, res) => {
  res.json(await friends.friendPage(req.userId, req.params.id));
};

export const remove: RequestHandler<Id> = async (req, res) => {
  await friends.removeFriend(req.userId, req.params.id);
  res.status(204).end();
};
