import type { RequestHandler } from 'express';
import * as inbox from './inbox.service.ts';

type Id = { id: string };

export const list: RequestHandler = async (req, res) => {
  res.json({ entries: await inbox.listEntries(req.userId) });
};

export const open: RequestHandler<Id> = async (req, res) => {
  await inbox.openEntry(req.userId, req.params.id);
  res.status(204).end();
};

export const dismiss: RequestHandler<Id> = async (req, res) => {
  await inbox.dismissEntry(req.userId, req.params.id);
  res.status(204).end();
};
