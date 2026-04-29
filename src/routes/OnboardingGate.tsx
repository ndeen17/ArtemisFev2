import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { stepToPath } from '@/store/onboardingStore';

/**
 * Wizard route gate. Three rules:
 * 1. Must be signed in (otherwise → /signin).
 * 2. If onboardingComplete → bounce out to /dashboard.
 * 3. If signed-in user landed on the wrong step's URL, redirect to the canonical
 *    URL for `user.onboardingStep`. This is what makes refresh-resumes-cleanly work.
 */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }
  if (user.onboardingComplete) {
    return <Navigate to="/dashboard" replace />;
  }
  const expected = stepToPath[user.onboardingStep];
  if (expected && location.pathname !== expected && !location.pathname.startsWith(expected)) {
    return <Navigate to={expected} replace />;
  }
  return <>{children}</>;
}
