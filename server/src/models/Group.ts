import { type HydratedDocument, type InferSchemaType, Schema, Types, model } from 'mongoose';

const groupSchema = new Schema(
  {
    owner: { type: Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    desc: { type: String, default: '' },
    // Includes the owner.
    members: [{ type: Types.ObjectId, ref: 'User', index: true }],
  },
  { timestamps: true },
);

export type GroupDoc = HydratedDocument<InferSchemaType<typeof groupSchema>>;
export const Group = model('Group', groupSchema);
