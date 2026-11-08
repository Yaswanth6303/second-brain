import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.ts';
import * as c from './inbox.controller.ts';

export const inboxRouter = Router()
  .use(requireAuth)
  .get('/', c.list)
  .post('/:id/open', c.open)
  .post('/:id/dismiss', c.dismiss);
