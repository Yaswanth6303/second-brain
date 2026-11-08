import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.ts';
import { validate } from '../../middleware/validate.ts';
import * as c from './friends.controller.ts';
import { requestSchema } from './friends.schemas.ts';

export const friendsRouter = Router()
  .use(requireAuth)
  .get('/', c.list)
  .post('/requests', validate({ body: requestSchema }), c.request)
  .post('/requests/:id/accept', c.accept)
  .post('/requests/:id/decline', c.decline)
  .get('/:id', c.page)
  .delete('/:id', c.remove);
