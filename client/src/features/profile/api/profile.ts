import { api } from "../../../lib/api-client.ts";
import type { User } from "../../auth/index.ts";
import type { Person } from "../../friends/index.ts";
import type { ShelfLink } from "../../library/index.ts";

export type ProfileInput = Partial<Pick<User, "name" | "handle" | "email" | "bio" | "hue">> & {
  currentPassword?: string;
};
export type Prefs = User["prefs"];

export const updateProfile = (body: ProfileInput) =>
  api<{ user: User }>("/users/me", { method: "PATCH", body }).then((r) => r.user);
export const updatePrefs = (body: Partial<Prefs>) =>
  api<{ user: User }>("/users/me/prefs", { method: "PATCH", body }).then((r) => r.user);
export const exportLibrary = () => api<unknown>("/users/me/export");
export const deleteAccount = () => api<void>("/users/me", { method: "DELETE" });
export const profileByHandle = (handle: string) =>
  api<{ user: Person; since: string; shelf: ShelfLink[] }>(`/users/${encodeURIComponent(handle)}`);
