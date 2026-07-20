import { Spinner } from "@/components/ui/spinner";
import { useGetMe } from "@/features/auth/hooks/use-get-me";
import { useAuthStore } from "@/features/auth/store";
import { Navigate, Outlet, useLocation } from "react-router-dom";

interface AuthGuardLayoutProps {
  requiresAuth: boolean;
}

// Route-tree wrapper that decides whether the caller has permission to view
// its children based on the auth store. Two modes:
//   requiresAuth=true  → send unauthenticated users to /sign-in
//   requiresAuth=false → send already-signed-in users away from public pages
//                        (prevents /sign-in from being reachable when logged in)
export default function AuthGuardLayout({
  requiresAuth,
}: AuthGuardLayoutProps) {
  const location = useLocation();
  // Read the persisted token synchronously so we don't flash the sign-in page
  // on hard refresh while /me is still loading.
  const hasToken = useAuthStore((s) => !!s.accessToken);
  const { me, isGettingMe } = useGetMe({ enabled: hasToken });

  // Treat either a decoded token *or* a fresh /me response as "authenticated".
  // /me only runs when an API base URL is configured; the fake-sign-in flow
  // relies purely on the token.
  const isAuthenticated = hasToken || !!me;

  if (hasToken && isGettingMe && !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (requiresAuth && !isAuthenticated) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  if (!requiresAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
