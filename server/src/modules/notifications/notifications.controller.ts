import type { RequestHandler } from 'express';
import * as notifications from './notifications.service.ts';

export const list: RequestHandler = async (req, res) => {
  res.json(await notifications.listNotifications(req.userId));
};

export const seen: RequestHandler = async (req, res) => {
  await notifications.markSeen(req.userId);
  res.status(204).end();
};
