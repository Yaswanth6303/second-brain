import { z } from "zod";
import { ApiError } from "../../lib/api-client.ts";

const email = (error: string) => z.string().trim().pipe(z.email({ error }));

export const loginSchema = z.object({
  email: email("Enter the email you signed up with."),
  password: z.string().min(8, { error: "Your password has at least 8 characters." }),
  remember: z.string().optional().transform(Boolean),
});

export const signupSchema = z.object({
  name: z.string().trim().min(1, { error: "Tell us what to call you." }),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.]{3,20}$/, {
      error: "Use 3 to 20 lowercase letters, numbers, dots or underscores.",
    }),
  email: email("Enter a valid email address."),
  password: z.string().min(8, { error: "Use at least 8 characters." }),
  terms: z.literal("on", { error: "You need to agree before you can sign up." }),
});

export const forgotSchema = z.object({ email: email("Enter a valid email address.") });
export const resetSchema = z.object({
  password: z.string().min(8, { error: "Use at least 8 characters." }),
});

export type Errors = Record<string, string | undefined>;

// Validates a form's FormData; returns parsed data or per-field messages.
export function parseForm<S extends z.ZodType>(schema: S, form: HTMLFormElement) {
  const r = schema.safeParse(Object.fromEntries(new FormData(form)));
  if (r.success) return { data: r.data as z.infer<S>, errors: {} as Errors };
  const errors: Errors = {};
  for (const issue of r.error.issues) errors[String(issue.path[0])] ??= issue.message;
  return { data: null, errors };
}

// Turns an API failure into field errors plus a form-level message.
export function apiErrors(e: unknown): Errors {
  if (e instanceof ApiError) return { ...e.fields, form: e.fields ? undefined : e.message };
  return { form: "Could not reach the server. Try again." };
}
