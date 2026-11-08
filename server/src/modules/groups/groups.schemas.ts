import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-f]{24}$/);

const fields = {
  name: z.string().trim().min(1, { error: 'Name the group.' }).max(40),
  desc: z.string().trim().max(90),
  members: z.array(objectId).min(1, { error: 'Pick at least one member.' }),
};

export const createGroupSchema = z.object({ ...fields, desc: fields.desc.default('') });
export const updateGroupSchema = z.object(fields).partial();

export type GroupInput = z.infer<typeof createGroupSchema>;
