import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.ts';
import { validate } from '../../middleware/validate.ts';
import * as c from './shares.controller.ts';
import { createSharesSchema, reactSchema } from './shares.schemas.ts';

export const sharesRouter = Router()
  .use(requireAuth)
  .post('/', validate({ body: createSharesSchema }), c.create)
  .get('/sent', c.sent)
  .delete('/:id', c.remove)
  .post('/:id/save', c.save)
  .patch('/:id/react', validate({ body: reactSchema }), c.react);
