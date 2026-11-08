import type { RequestHandler } from 'express';
import * as groups from './groups.service.ts';

type Id = { id: string };

export const list: RequestHandler = async (req, res) => {
  res.json({ groups: await groups.listGroups(req.userId) });
};

export const create: RequestHandler = async (req, res) => {
  res.status(201).json({ group: await groups.createGroup(req.userId, req.body) });
};

export const page: RequestHandler<Id> = async (req, res) => {
  res.json(await groups.groupPage(req.userId, req.params.id));
};

export const update: RequestHandler<Id> = async (req, res) => {
  res.json({ group: await groups.updateGroup(req.userId, req.params.id, req.body) });
};

export const remove: RequestHandler<Id> = async (req, res) => {
  await groups.deleteGroup(req.userId, req.params.id);
  res.status(204).end();
};

export const leave: RequestHandler<Id> = async (req, res) => {
  await groups.leaveGroup(req.userId, req.params.id);
  res.status(204).end();
};
