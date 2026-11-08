import { type HydratedDocument, type InferSchemaType, Schema, Types, model } from 'mongoose';

// One recipient's copy of a share: what they did with it.
const inboxSchema = new Schema(
  {
    recipient: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    share: { type: Types.ObjectId, ref: 'Share', required: true, index: true },
    from: { type: Types.ObjectId, ref: 'User', required: true },
    state: { type: String, enum: ['new', 'saved', 'dismissed'], default: 'new' },
  },
  { timestamps: true },
);

export type InboxEntryDoc = HydratedDocument<InferSchemaType<typeof inboxSchema>>;
export const InboxEntry = model('InboxEntry', inboxSchema);
