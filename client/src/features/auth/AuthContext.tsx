import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, createContext, useContext } from "react";
import * as authApi from "./api/auth.ts";
import type { User } from "./types.ts";

type Auth = {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Auth | null>(null);
const ME = ["me"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { data, isPending } = useQuery({
    queryKey: ME,
    queryFn: authApi.me,
    retry: false,
    staleTime: Infinity,
  });
  const setUser = (u: User | null) => qc.setQueryData(ME, u);
  const logout = async () => {
    await authApi.logout();
    setUser(null);
    // Drop everything cached for this user except the (now null) session.
    qc.removeQueries({ predicate: (q) => q.queryKey[0] !== ME[0] });
  };
  return (
    <AuthContext.Provider value={{ user: data ?? null, loading: isPending, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): Auth {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth needs <AuthProvider>");
  return ctx;
}
