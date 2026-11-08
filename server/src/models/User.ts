import { type InferSchemaType, type HydratedDocument, Schema, Types, model } from 'mongoose';
import { CARD_HUES } from '../lib/types.ts';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    handle: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    bio: { type: String, default: '' },
    hue: { type: Number, default: () => CARD_HUES[Math.floor(Math.random() * CARD_HUES.length)] },
    prefs: {
      who: {
        type: String,
        enum: ['friends', 'anyone', 'nobody'],
        default: 'friends',
      },
      status: { type: Boolean, default: true },
      pub: { type: Boolean, default: false },
      digest: { type: Boolean, default: true },
      dust: { type: Boolean, default: true },
    },
    shelf: [{ type: Types.ObjectId, ref: 'Item' }],
    collections: [String],
    customTypes: [
      {
        _id: false,
        key: String,
        label: String,
        plural: String,
        icon: String,
      },
    ],
    notificationsSeenAt: Date,
    // Tokens issued before this are rejected, so a reset logs out other devices.
    passwordChangedAt: Date,
    resetTokenHash: String,
    resetExpires: Date,
  },
  { timestamps: true },
);

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>>;
export const User = model('User', userSchema);

export function toPublicUser(u: UserDoc) {
  return {
    id: u.id as string,
    name: u.name,
    handle: u.handle,
    email: u.email,
    bio: u.bio,
    hue: u.hue,
    prefs: {
      who: u.prefs!.who,
      status: u.prefs!.status,
      pub: u.prefs!.pub,
      digest: u.prefs!.digest,
      dust: u.prefs!.dust,
    },
    createdAt: u.createdAt,
  };
}

// What the signed-in user sees about themselves (adds their library settings).
export function toSelf(u: UserDoc) {
  return {
    ...toPublicUser(u),
    shelf: u.shelf.map(String),
    collections: u.collections,
    customTypes: u.customTypes.map(({ key, label, plural, icon }) => ({
      key,
      label,
      plural,
      icon,
    })),
  };
}

// What other people may see about someone.
export function toPerson(u: Pick<UserDoc, 'id' | 'name' | 'handle' | 'bio' | 'hue'>) {
  return { id: String(u.id), name: u.name, handle: u.handle, bio: u.bio, hue: u.hue };
}
