import { z } from 'zod';

export const requestSchema = z.object({
  who: z.string().trim().min(3, { error: 'Enter a username or an email address.' }),
});
