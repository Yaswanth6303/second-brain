import { type HydratedDocument, type InferSchemaType, Schema, Types, model } from 'mongoose';

// One document per pair of people; `pair` (both ids, sorted) keeps it unique either way round.
const friendshipSchema = new Schema(
  {
    requester: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    recipient: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    pair: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
    acceptedAt: Date,
  },
  { timestamps: true },
);

export const pairKey = (a: string, b: string) => [a, b].toSorted().join(':');

export type FriendshipDoc = HydratedDocument<InferSchemaType<typeof friendshipSchema>>;
export const Friendship = model('Friendship', friendshipSchema);
