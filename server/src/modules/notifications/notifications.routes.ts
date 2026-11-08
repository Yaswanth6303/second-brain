import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.ts';
import * as c from './notifications.controller.ts';

export const notificationsRouter = Router().use(requireAuth).get('/', c.list).post('/seen', c.seen);
