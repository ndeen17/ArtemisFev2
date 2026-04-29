import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { stepToPath } from '@/store/onboardingStore';

/**
 * ProtectedRoute — guards authenticated app routes.
 *
 *  1. Unauthenticated → bounce to /signin (preserving `from` so we can
 *     return after sign-in).
 *  2. Authenticated but onboarding NOT complete → bounce to the user's
 *     canonical onboarding step. This stops users from typing `/dashboard`
 *     or any other deep URL to skip the wizard. The completion screen
 *     itself (`/onboarding/complete`) is exempt because it runs the
 *     final completion mutation.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  const isCompletionScreen = location.pathname === '/onboarding/complete';
  if (!user.onboardingComplete && !isCompletionScreen) {
    const target = stepToPath[user.onboardingStep] ?? '/onboarding/role';
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}
