import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.ts';
import { validate } from '../../middleware/validate.ts';
import * as c from './users.controller.ts';
import { collectionSchema, shelfSchema, typeSchema } from './users.schemas.ts';

export const usersRouter = Router()
  .use(requireAuth)
  .get('/me', c.me)
  .post('/me/collections', validate({ body: collectionSchema }), c.addCollection)
  .delete('/me/collections/:name', c.deleteCollection)
  .post('/me/types', validate({ body: typeSchema }), c.addType)
  .put('/me/shelf', validate({ body: shelfSchema }), c.setShelf);
