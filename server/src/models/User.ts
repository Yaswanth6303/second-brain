import { type InferSchemaType, type HydratedDocument, Schema, Types, model } from 'mongoose';

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
    hue: { type: Number, default: () => Math.floor(Math.random() * 360) },
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
        color: String,
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
