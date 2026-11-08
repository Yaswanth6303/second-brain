import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-f]{24}$/, { error: 'Not found.' });

export const createSharesSchema = z.object({
  itemIds: z.array(objectId).min(1, { error: 'Pick at least one link' }),
  friends: z.array(objectId).default([]),
  groups: z.array(objectId).default([]),
  handles: z.array(z.string().trim().min(1)).default([]),
  msg: z.string().trim().max(280).default(''),
});

export const reactSchema = z.object({ react: z.string().trim().max(280) });

export type CreateSharesInput = z.infer<typeof createSharesSchema>;
