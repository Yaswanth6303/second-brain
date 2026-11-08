import { z } from 'zod';

const oneSpaced = (s: string) => s.trim().replace(/\s+/g, ' ');

export const collectionSchema = z.object({
  name: z
    .string()
    .transform(oneSpaced)
    .pipe(z.string().min(1, { error: 'Give the new collection a name.' }).max(30)),
});

export const typeSchema = z.object({
  label: z
    .string()
    .transform(oneSpaced)
    .pipe(z.string().min(1, { error: 'Give the new type a name.' }).max(20)),
  icon: z.string().default('bi-bookmark'),
});

export const shelfSchema = z.object({ ids: z.array(z.string().regex(/^[0-9a-f]{24}$/)) });

export type TypeInput = z.infer<typeof typeSchema>;
