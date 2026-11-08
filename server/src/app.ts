import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import morgan from 'morgan';
import { env } from './config/env.ts';
import { errorHandler, notFound } from './middleware/error.ts';
import { authRouter } from './modules/auth/auth.routes.ts';
import { friendsRouter } from './modules/friends/friends.routes.ts';
import { groupsRouter } from './modules/groups/groups.routes.ts';
import { inboxRouter } from './modules/inbox/inbox.routes.ts';
import { itemsRouter } from './modules/items/items.routes.ts';
import { notificationsRouter } from './modules/notifications/notifications.routes.ts';
import { sharesRouter } from './modules/shares/shares.routes.ts';
import { usersRouter } from './modules/users/users.routes.ts';

export function createApp(): Express {
  const app = express();
  // Request logs: colored one-liners in dev, Apache style in prod, silent in tests.
  if (env.NODE_ENV !== 'test') app.use(morgan(env.isProd ? 'combined' : 'dev'));
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/items', itemsRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/friends', friendsRouter);
  app.use('/api/shares', sharesRouter);
  app.use('/api/inbox', inboxRouter);
  app.use('/api/groups', groupsRouter);
  app.use('/api/notifications', notificationsRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
