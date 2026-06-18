import { ReactNode } from "react";
import { useStore } from "./store";
import { AuthPage } from "./AuthPage";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { currentUser } = useStore();
  if (!currentUser) return <AuthPage />;
  return <>{children}</>;
}
