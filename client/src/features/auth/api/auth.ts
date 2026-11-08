import { ApiError, api } from "../../../lib/api-client.ts";
import type { User } from "../types.ts";

type UserRes = { user: User };

// A 401 here just means "not logged in", so it resolves to null instead of throwing.
export const me = () =>
  api<UserRes>("/auth/me").then(
    (r) => r.user,
    (e: unknown) => {
      if (e instanceof ApiError && e.status === 401) return null;
      throw e;
    },
  );

export const login = (body: { email: string; password: string; remember: boolean }) =>
  api<UserRes>("/auth/login", { method: "POST", body }).then((r) => r.user);

export const signup = (body: { name: string; handle: string; email: string; password: string }) =>
  api<UserRes>("/auth/signup", { method: "POST", body }).then((r) => r.user);

export const logout = () => api<void>("/auth/logout", { method: "POST" });

export const forgot = (email: string) =>
  api<{ ok: true }>("/auth/forgot", { method: "POST", body: { email } });

export const reset = (body: { token: string; password: string }) =>
  api<UserRes>("/auth/reset", { method: "POST", body }).then((r) => r.user);
