import type { RequestHandler } from 'express';
import { toItemJson } from '../../models/Item.ts';
import * as items from './items.service.ts';

type IdParams = { id: string };

export const list: RequestHandler = async (req, res) => {
  res.json({ items: (await items.listItems(req.userId)).map(toItemJson) });
};

export const create: RequestHandler = async (req, res) => {
  res.status(201).json({ item: toItemJson(await items.createItem(req.userId, req.body)) });
};

export const update: RequestHandler<IdParams> = async (req, res) => {
  res.json({ item: toItemJson(await items.updateItem(req.userId, req.params.id, req.body)) });
};

export const remove: RequestHandler<IdParams> = async (req, res) => {
  await items.deleteItem(req.userId, req.params.id);
  res.status(204).end();
};
