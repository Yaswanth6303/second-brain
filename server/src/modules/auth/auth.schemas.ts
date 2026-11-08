import { z } from 'zod';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Enter a valid email address.' }));
const password = z.string().min(8, { error: 'Use at least 8 characters.' });

export const handle = z
  .string()
  .trim()
  .regex(/^[a-z0-9_.]{3,20}$/, {
    error: 'Use 3 to 20 lowercase letters, numbers, dots or underscores.',
  });

export const signupSchema = z.object({
  name: z.string().trim().min(1, { error: 'Tell us what to call you.' }),
  handle,
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1),
  remember: z.boolean().default(true),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotSchema = z.object({ email });
export const resetSchema = z.object({ token: z.string().min(1), password });

export type ResetInput = z.infer<typeof resetSchema>;
