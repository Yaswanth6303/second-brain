import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { env } from '../config/env.ts';
import { connectDb } from '../db/connect.ts';
import { resetRateLimits } from '../middleware/rate-limit.ts';

beforeAll(async () => {
  await connectDb(env.MONGO_URI_TEST);
  // Unique indexes must exist before duplicate-key tests run.
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
});

beforeEach(async () => {
  resetRateLimits();
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

afterAll(() => mongoose.disconnect());
