import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.ts';
import { validate } from '../../middleware/validate.ts';
import * as c from './groups.controller.ts';
import { createGroupSchema, updateGroupSchema } from './groups.schemas.ts';

export const groupsRouter = Router()
  .use(requireAuth)
  .get('/', c.list)
  .post('/', validate({ body: createGroupSchema }), c.create)
  .get('/:id', c.page)
  .patch('/:id', validate({ body: updateGroupSchema }), c.update)
  .delete('/:id', c.remove)
  .post('/:id/leave', c.leave);
