import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { HttpError } from '../../lib/http-error.ts';
import { User, type UserDoc } from '../../models/User.ts';
import type { LoginInput, ResetInput, SignupInput } from './auth.schemas.ts';

const BCRYPT_COST = 10;
const RESET_TTL_MS = 3600 * 1000;

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export async function signup({ password, ...rest }: SignupInput): Promise<UserDoc> {
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  return User.create({ ...rest, passwordHash });
}

export async function login({ email, password }: LoginInput): Promise<UserDoc> {
  const user = await User.findOne({ email });
  // Same error for unknown email and wrong password, so accounts can't be probed.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Email or password is wrong.');
  }
  return user;
}

export async function getUser(id: string): Promise<UserDoc> {
  const user = await User.findById(id);
  if (!user) throw new HttpError(401, 'Log in to continue.');
  return user;
}

// Returns the raw token (only its hash is stored), or null when no account matches.
export async function requestReset(email: string): Promise<string | null> {
  const token = randomBytes(32).toString('hex');
  const user = await User.findOneAndUpdate(
    { email },
    {
      resetTokenHash: sha256(token),
      resetExpires: new Date(Date.now() + RESET_TTL_MS),
    },
  );
  return user ? token : null;
}

export async function resetPassword({ token, password }: ResetInput): Promise<UserDoc> {
  const user = await User.findOne({
    resetTokenHash: sha256(token),
    resetExpires: { $gt: new Date() },
  });
  if (!user) throw new HttpError(400, 'This reset link has expired. Ask for a new one.');
  user.passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  user.passwordChangedAt = new Date();
  user.resetTokenHash = undefined;
  user.resetExpires = undefined;
  return user.save();
}
