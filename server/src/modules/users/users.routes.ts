import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.ts';
import { validate } from '../../middleware/validate.ts';
import * as c from './users.controller.ts';
import {
  collectionSchema,
  prefsSchema,
  profileSchema,
  shelfSchema,
  typeSchema,
} from './users.schemas.ts';

export const usersRouter = Router()
  .use(requireAuth)
  .get('/me', c.me)
  .patch('/me', validate({ body: profileSchema }), c.updateProfile)
  .delete('/me', c.deleteAccount)
  .patch('/me/prefs', validate({ body: prefsSchema }), c.updatePrefs)
  .get('/me/export', c.exportLibrary)
  .post('/me/collections', validate({ body: collectionSchema }), c.addCollection)
  .delete('/me/collections/:name', c.deleteCollection)
  .post('/me/types', validate({ body: typeSchema }), c.addType)
  .put('/me/shelf', validate({ body: shelfSchema }), c.setShelf)
  .get('/:handle', c.byHandle);
