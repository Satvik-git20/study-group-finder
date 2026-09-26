import { Navigate, Outlet, useLocation } from "react-router";
import { useCurrentUser } from "../store";

/**
 * Gate for every authenticated route. Unauthenticated visitors are sent to
 * /login, and returned to where they were headed once they sign in.
 */
export function RequireAuth() {
  const currentUser = useCurrentUser();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
