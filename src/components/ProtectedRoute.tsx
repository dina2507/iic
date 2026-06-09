import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireModerator?: boolean;
  requireDomainAdmin?: boolean;
  requireDomainMember?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireModerator = false,
  requireDomainAdmin = false,
  requireDomainMember = false
}: ProtectedRouteProps) {
  const { user, loading, rolesLoading, isAdmin, isModerator, isDomainAdmin, isDomainMember } = useAuth();
  const location = useLocation();

  const needsRoles =
    requireAdmin || requireModerator || requireDomainAdmin || requireDomainMember;

  // Wait for the session AND (for role-gated routes) the role lookup to
  // resolve. Otherwise a legitimate admin refreshing /admin gets bounced to
  // "/" during the brief window where roles haven't loaded yet.
  if (loading || (!!user && needsRoles && rolesLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireModerator && !isAdmin && !isModerator) {
    return <Navigate to="/" replace />;
  }

  if (requireDomainAdmin && !isAdmin && !isModerator && !isDomainAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireDomainMember && !isAdmin && !isModerator && !isDomainAdmin && !isDomainMember) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}