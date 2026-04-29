import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

/**
 * ProtectedRoute — redirects unauthenticated users to /signin while preserving
 * the original location so we can bounce back after sign-in (Phase 4 will use it).
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}
