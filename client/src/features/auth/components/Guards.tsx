import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../AuthContext.tsx";

export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

// Login/signup pages bounce logged-in users into the app.
export function GuestOnly() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/library" replace /> : <Outlet />;
}
