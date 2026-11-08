import { type HydratedDocument, type InferSchemaType, Schema, Types, model } from 'mongoose';

const itemSchema = new Schema(
  {
    owner: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    url: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, required: true },
    tags: [String],
    mins: { type: Number, default: 0 },
    status: { type: String, enum: ['queue', 'progress', 'done'], default: 'queue' },
    fav: { type: Boolean, default: false },
    note: { type: String, default: '' },
    coll: { type: String, default: '' },
    remindAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type ItemDoc = HydratedDocument<InferSchemaType<typeof itemSchema>>;
export const Item = model('Item', itemSchema);

export function toItemJson(i: ItemDoc) {
  return {
    id: i.id as string,
    url: i.url,
    title: i.title,
    type: i.type,
    tags: i.tags,
    mins: i.mins,
    status: i.status,
    fav: i.fav,
    note: i.note,
    coll: i.coll,
    remindAt: i.remindAt,
    savedAt: i.createdAt,
  };
}
