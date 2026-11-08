import { z } from 'zod';

const url = z
  .string()
  .trim()
  .refine((v) => /^https?:\/\/[^\s/]+\.[^\s]+$/i.test(v), {
    error: 'Enter a full link that starts with https://',
  });

// Same rules as the prototype's tag box: lowercase, spaces to dashes, no "#", 8 at most.
const tags = z
  .array(z.string())
  .transform((list) =>
    [
      ...new Set(
        list
          .map((t) => t.trim().replace(/^#/, '').toLowerCase().replace(/\s+/g, '-'))
          .filter(Boolean),
      ),
    ].slice(0, 8),
  );

// Fields without defaults: a default inside .partial() would still fill in missing keys
// and wipe them on every PATCH.
const fields = {
  url,
  title: z.string().trim().min(1, { error: 'Give this link a name.' }).max(120),
  type: z.string().min(1, { error: 'Pick a type.' }).max(40),
  tags,
  mins: z.number().int().min(0).max(6000),
  note: z.string().trim().max(1000),
  coll: z.string().trim().max(30),
  remindAt: z.union([z.null(), z.iso.datetime()]),
};

export const createItemSchema = z.object({
  ...fields,
  tags: fields.tags.default([]),
  mins: fields.mins.default(0),
  note: fields.note.default(''),
  coll: fields.coll.default(''),
  remindAt: fields.remindAt.default(null),
});

export const updateItemSchema = z
  .object(fields)
  .partial()
  .extend({
    status: z.enum(['queue', 'progress', 'done']).optional(),
    fav: z.boolean().optional(),
  });

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
