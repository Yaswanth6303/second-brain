import { z } from 'zod';

// Bun loads server/.env automatically; fail fast if anything is missing.
const schema = z.object({
  PORT: z.coerce.number().default(4000),
  MONGO_URI: z.string().min(1),
  MONGO_URI_TEST: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  NODE_ENV: z.string().default('development'),
});

const parsed = schema.parse(process.env);

export const env = { ...parsed, isProd: parsed.NODE_ENV === 'production' };
