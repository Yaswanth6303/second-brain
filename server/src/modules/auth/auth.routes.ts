import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.ts';
import { validate } from '../../middleware/validate.ts';
import * as c from './auth.controller.ts';
import { forgotSchema, loginSchema, resetSchema, signupSchema } from './auth.schemas.ts';

export const authRouter = Router()
  .post('/signup', validate({ body: signupSchema }), c.signup)
  .post('/login', validate({ body: loginSchema }), c.login)
  .post('/logout', c.logout)
  .post('/forgot', validate({ body: forgotSchema }), c.forgot)
  .post('/reset', validate({ body: resetSchema }), c.reset)
  .get('/me', requireAuth, c.me);
