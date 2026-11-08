import { type HydratedDocument, type InferSchemaType, Schema, Types, model } from 'mongoose';

// A link put on a friend's or a group's watchlist. Keeps its own copy of the link details.
const shareSchema = new Schema(
  {
    item: { type: Types.ObjectId, ref: 'Item', required: true, index: true },
    from: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    kind: { type: String, enum: ['friend', 'group'], required: true },
    toUser: { type: Types.ObjectId, ref: 'User', index: true },
    toGroup: { type: Types.ObjectId, ref: 'Group', index: true },
    url: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, required: true },
    mins: { type: Number, default: 0 },
    msg: { type: String, default: '' },
    seen: { type: String, enum: ['new', 'opened', 'done'], default: 'new' },
    seenAt: Date,
    done: [{ _id: false, user: { type: Types.ObjectId, ref: 'User' }, at: Date }],
    react: { type: String, default: '' },
  },
  { timestamps: true },
);

export type ShareDoc = HydratedDocument<InferSchemaType<typeof shareSchema>>;
export const Share = model('Share', shareSchema);
