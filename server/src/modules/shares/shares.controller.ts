import type { RequestHandler } from 'express';
import { toItemJson } from '../../models/Item.ts';
import * as shares from './shares.service.ts';

type Id = { id: string };

export const create: RequestHandler = async (req, res) => {
  res
    .status(201)
    .json({ shares: (await shares.createShares(req.userId, req.body)).map(shares.shareJson) });
};

export const sent: RequestHandler = async (req, res) => {
  res.json({ shares: await shares.sentShares(req.userId) });
};

export const remove: RequestHandler<Id> = async (req, res) => {
  await shares.deleteShare(req.userId, req.params.id);
  res.status(204).end();
};

export const save: RequestHandler<Id> = async (req, res) => {
  res.json({ item: toItemJson(await shares.saveShare(req.userId, req.params.id)) });
};

export const react: RequestHandler<Id> = async (req, res) => {
  await shares.reactToShare(req.userId, req.params.id, req.body.react);
  res.status(204).end();
};
