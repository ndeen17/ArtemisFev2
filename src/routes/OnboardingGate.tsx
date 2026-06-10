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
// still preventing skip-ahead. All CV-phase steps (cv, no_cv, cv_builder_*)
// share the same index because they are mutually exclusive branches of the
// same wizard phase — none is a forward progression of another.
const STEP_ORDER: Record<OnboardingStep, number> = {
  role: 0,
  goal: 1,
  cv: 2,
  no_cv: 2,
  cv_builder_jd: 2,
  cv_builder_questionnaire: 2,
  linkedin: 4,
  complete: 5,
};

function stepForPath(pathname: string): OnboardingStep | null {
  // Builder steps must be checked before 'cv' because their URL
  // (/onboarding/cv/builder) is a sub-path of 'cv' (/onboarding/cv).
  // Checking 'cv' first would cause startsWith to swallow the builder URL
  // and return 'cv' instead of the correct builder step.
  const PREFER: OnboardingStep[] = [
    'role',
    'goal',
    'cv_builder_questionnaire',
    'cv_builder_jd',
    'no_cv',
    'cv',
    'linkedin',
    'complete',
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
  // Email/password users can't enter the onboarding wizard until they've
  // verified their email. Google users bypass (Google asserts verification).
  if (user.authProvider === 'password' && !user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
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
