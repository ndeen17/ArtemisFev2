import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { OnboardingStep } from '@artemis/shared';
import { useAuthStore } from '@/store/authStore';
import { stepToPath } from '@/store/onboardingStore';

/**
 * Wizard route gate. Three rules:
 * 1. Must be signed in (otherwise → /signin).
 * 2. If onboardingComplete → bounce out to /dashboard.
 * 3. Allow the user to revisit any earlier step's URL (back arrow), but block
 *    skipping ahead by redirecting forward navigations to the canonical URL.
 */

// Linear ordering of onboarding steps. Used to allow backward navigation while
// still preventing skip-ahead. CV / no-CV (and the two CV builder variants)
// share the same index because they are mutually exclusive branches.
const STEP_ORDER: Record<OnboardingStep, number> = {
  role: 0,
  goal: 1,
  cv: 2,
  no_cv: 2,
  cv_builder_jd: 3,
  cv_builder_questionnaire: 3,
  linkedin: 4,
  complete: 5,
};

function stepForPath(pathname: string): OnboardingStep | null {
  // Multiple steps can share the same URL (e.g. `/onboarding/cv/basics` is
  // shared by `cv_builder_questionnaire` and the legacy `no_cv`). Pick the
  // canonical (current) step where there's overlap so STEP_ORDER comparisons
  // line up with the user's actual progress on the server.
  const PREFER: OnboardingStep[] = [
    'role',
    'goal',
    'cv',
    'cv_builder_questionnaire',
    'cv_builder_jd',
    'linkedin',
    'complete',
    'no_cv',
  ];
  for (const step of PREFER) {
    const path = stepToPath[step];
    if (pathname === path || pathname.startsWith(`${path}/`)) return step;
  }
  return null;
}

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
  // Normalise the legacy `no_cv` step to the merged builder's first step.
  // The server already does this on read, but a stale persisted auth user
  // (localStorage) could still carry `no_cv` until /auth/me refreshes.
  const userStep: OnboardingStep =
    user.onboardingStep === 'no_cv' ? 'cv_builder_questionnaire' : user.onboardingStep;
  const currentStep = stepForPath(location.pathname);
  // /onboarding/cv/edit is a sub-route shared by all CV branches — allow it as
  // long as the user has at least reached the CV step.
  if (location.pathname === '/onboarding/cv/edit') {
    if (STEP_ORDER[userStep] < STEP_ORDER.cv) {
      return <Navigate to={stepToPath[userStep] ?? '/onboarding/role'} replace />;
    }
    return <>{children}</>;
  }
  if (!currentStep) {
    // Unknown onboarding URL — send user to their canonical step.
    return <Navigate to={stepToPath[userStep] ?? '/onboarding/role'} replace />;
  }
  // Block skip-ahead: only allow visiting a step at or before the user's progress.
  if (STEP_ORDER[currentStep] > STEP_ORDER[userStep]) {
    return <Navigate to={stepToPath[userStep] ?? '/onboarding/role'} replace />;
  }
  return <>{children}</>;
}
