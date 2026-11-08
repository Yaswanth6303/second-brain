import { z } from 'zod';
import { email, handle } from '../auth/auth.schemas.ts';

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

export const profileSchema = z
  .object({
    name: z.string().trim().min(1, { error: 'Your name cannot be empty.' }).max(80),
    handle: z.string().trim().toLowerCase().pipe(handle),
    email,
    bio: z.string().trim().max(140),
    // Any hue is valid: older accounts may hold a colour outside today's six swatches.
    hue: z.number().int().min(0).max(359),
    // Needed only when the email changes.
    currentPassword: z.string(),
  })
  .partial();

export const prefsSchema = z
  .object({
    who: z.enum(['friends', 'anyone', 'nobody']),
    status: z.boolean(),
    pub: z.boolean(),
    digest: z.boolean(),
    dust: z.boolean(),
  })
  .partial();

export type ProfileInput = z.infer<typeof profileSchema>;
export type PrefsInput = z.infer<typeof prefsSchema>;
