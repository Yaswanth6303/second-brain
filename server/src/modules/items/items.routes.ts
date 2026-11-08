import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.ts';
import { validate } from '../../middleware/validate.ts';
import * as c from './items.controller.ts';
import { createItemSchema, updateItemSchema } from './items.schemas.ts';

export const itemsRouter = Router()
  .use(requireAuth)
  .get('/', c.list)
  .post('/', validate({ body: createItemSchema }), c.create)
  .patch('/:id', validate({ body: updateItemSchema }), c.update)
  .delete('/:id', c.remove);
