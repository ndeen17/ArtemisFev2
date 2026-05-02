import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { OnboardingGate } from './OnboardingGate';
import { ProtectedRoute } from './ProtectedRoute';

/**
 * Wrap React.lazy with one-shot reload-on-stale-chunk recovery.
 *
 * After a redeploy, an open tab is still running the OLD index.html which
 * references hashed chunk filenames the new build no longer ships, so the
 * import 404s with "Failed to fetch dynamically imported module: …".
 * We catch that, set a session-scoped one-shot flag, and reload to fetch the
 * fresh index.html. On the next successful import we clear the flag so a
 * future stale deploy can self-heal the same way. Real network/build errors
 * (i.e. import still fails after a reload) are allowed to bubble.
 */
const CHUNK_RELOAD_FLAG = 'artemis:chunk-reloaded';

function isChunkLoadError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message || '';
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    err.name === 'ChunkLoadError'
  );
}

function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      try {
        sessionStorage.removeItem(CHUNK_RELOAD_FLAG);
      } catch {
        /* sessionStorage may throw in privacy modes */
      }
      return mod;
    } catch (err) {
      if (!isChunkLoadError(err)) throw err;
      let alreadyReloaded = false;
      try {
        alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_FLAG) === '1';
      } catch {
        /* ignore */
      }
      if (alreadyReloaded) throw err;
      try {
        sessionStorage.setItem(CHUNK_RELOAD_FLAG, '1');
      } catch {
        /* ignore */
      }
      window.location.reload();
      return new Promise<{ default: T }>(() => {});
    }
  });
}

const LandingPage = lazyWithRetry(() => import('@/pages/Landing/LandingPage'));
const NotFoundPage = lazyWithRetry(() => import('@/pages/NotFoundPage'));
const SignUpPage = lazyWithRetry(() => import('@/pages/Auth/SignUpPage'));
const SignInPage = lazyWithRetry(() => import('@/pages/Auth/SignInPage'));
const VerifyEmailPage = lazyWithRetry(() => import('@/pages/Auth/VerifyEmailPage'));
const GoogleCallbackPage = lazyWithRetry(() => import('@/pages/Auth/GoogleCallbackPage'));
const ForgotPasswordPage = lazyWithRetry(() => import('@/pages/Auth/ForgotPasswordPage'));
const ResetPasswordPage = lazyWithRetry(() => import('@/pages/Auth/ResetPasswordPage'));
const RolePage = lazyWithRetry(() => import('@/pages/Onboarding/RolePage'));
const GoalPage = lazyWithRetry(() => import('@/pages/Onboarding/GoalPage'));
const CvPage = lazyWithRetry(() => import('@/pages/Onboarding/CvPage'));
const NoCvPage = lazyWithRetry(() => import('@/pages/Onboarding/NoCvPage'));
const CvBuilderJdPage = lazyWithRetry(() => import('@/pages/Onboarding/CvBuilderJdPage'));
const CvBuilderQuestionnairePage = lazyWithRetry(
  () => import('@/pages/Onboarding/CvBuilderQuestionnairePage'),
);
const CvEditPage = lazyWithRetry(() => import('@/pages/Onboarding/CvEditPage'));
const ProfileCvEditPage = lazyWithRetry(() => import('@/pages/Profile/CvEditPage'));
const LinkedInPage = lazyWithRetry(() => import('@/pages/Onboarding/LinkedInPage'));
const CompletePage = lazyWithRetry(() => import('@/pages/Onboarding/CompletePage'));
const DashboardPage = lazyWithRetry(() => import('@/pages/DashboardPage'));
const ProfilePage = lazyWithRetry(() => import('@/pages/ProfilePage'));
const CvAnalysisPage = lazyWithRetry(() => import('@/pages/Profile/CvAnalysisPage'));
const CvRewriterPage = lazyWithRetry(() => import('@/pages/Profile/CvRewriterPage'));
const LinkedInAnalysisPage = lazyWithRetry(() => import('@/pages/Profile/LinkedInAnalysisPage'));
const ScoreRevealPage = lazyWithRetry(() => import('@/pages/Profile/ScoreRevealPage'));
const ActionPlanPage = lazyWithRetry(() => import('@/pages/Profile/ActionPlanPage'));
const ApplicationsPage = lazyWithRetry(() => import('@/pages/ApplicationsPage'));
const NewApplicationPage = lazyWithRetry(() => import('@/pages/Applications/NewApplicationPage'));
const ApplicationDetailPage = lazyWithRetry(
  () => import('@/pages/Applications/ApplicationDetailPage'),
);
const JdTargetPage = lazyWithRetry(() => import('@/pages/Applications/JdTargetPage'));
const CvReviewPage = lazyWithRetry(() => import('@/pages/Applications/CvReviewPage'));
const TargetedCvEditPage = lazyWithRetry(
  () => import('@/pages/Applications/TargetedCvEditPage'),
);
const CoverLetterPage = lazyWithRetry(() => import('@/pages/Applications/CoverLetterPage'));
const InterviewsPage = lazyWithRetry(() => import('@/pages/InterviewsPage'));
const NewInterviewPage = lazyWithRetry(() => import('@/pages/Interviews/NewInterviewPage'));
const InterviewDetailPage = lazyWithRetry(() => import('@/pages/Interviews/InterviewDetailPage'));
const SettingsGoalPage = lazyWithRetry(() => import('@/pages/Settings/SettingsGoalPage'));
const SettingsProfilePage = lazyWithRetry(() => import('@/pages/Settings/SettingsProfilePage'));
const SettingsResumePage = lazyWithRetry(() => import('@/pages/Settings/SettingsResumePage'));

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  // Phase 1: auth surface
  { path: '/signup', element: <SignUpPage /> },
  { path: '/signin', element: <SignInPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },
  { path: '/auth/callback/google', element: <GoogleCallbackPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password/:token', element: <ResetPasswordPage /> },

  // Phase 2: onboarding wizard (gated — auth + !onboardingComplete + correct step)
  {
    path: '/onboarding/role',
    element: (
      <OnboardingGate>
        <RolePage />
      </OnboardingGate>
    ),
  },
  {
    path: '/onboarding/goal',
    element: (
      <OnboardingGate>
        <GoalPage />
      </OnboardingGate>
    ),
  },
  {
    path: '/onboarding/cv',
    element: (
      <OnboardingGate>
        <CvPage />
      </OnboardingGate>
    ),
  },
  {
    path: '/onboarding/no-cv',
    element: (
      <OnboardingGate>
        <NoCvPage />
      </OnboardingGate>
    ),
  },
  {
    path: '/onboarding/cv/jd',
    element: (
      <OnboardingGate>
        <CvBuilderJdPage />
      </OnboardingGate>
    ),
  },
  {
    path: '/onboarding/cv/builder',
    element: (
      <OnboardingGate>
        <CvBuilderQuestionnairePage />
      </OnboardingGate>
    ),
  },
  {
    path: '/onboarding/cv/edit',
    element: (
      <OnboardingGate>
        <CvEditPage />
      </OnboardingGate>
    ),
  },
  {
    path: '/onboarding/linkedin',
    element: (
      <OnboardingGate>
        <LinkedInPage />
      </OnboardingGate>
    ),
  },
  // Completion screen runs OUTSIDE the gate so onboardingComplete=true users can see the celebration
  // before being redirected to /dashboard.
  {
    path: '/onboarding/complete',
    element: (
      <ProtectedRoute>
        <CompletePage />
      </ProtectedRoute>
    ),
  },

  // Phase 4 will replace this stub with the real dashboard.
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile/cv',
    element: (
      <ProtectedRoute>
        <CvAnalysisPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile/cv/rewrite',
    element: (
      <ProtectedRoute>
        <CvRewriterPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile/cv/edit',
    element: (
      <ProtectedRoute>
        <ProfileCvEditPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile/linkedin',
    element: (
      <ProtectedRoute>
        <LinkedInAnalysisPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile/score-reveal',
    element: (
      <ProtectedRoute>
        <ScoreRevealPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile/action-plan',
    element: (
      <ProtectedRoute>
        <ActionPlanPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/applications',
    element: (
      <ProtectedRoute>
        <ApplicationsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/applications/new',
    element: (
      <ProtectedRoute>
        <NewApplicationPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/applications/:id',
    element: (
      <ProtectedRoute>
        <ApplicationDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/applications/:id/jd',
    element: (
      <ProtectedRoute>
        <JdTargetPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/applications/:id/cv-review',
    element: (
      <ProtectedRoute>
        <CvReviewPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/applications/:id/targeted-cv/edit',
    element: (
      <ProtectedRoute>
        <TargetedCvEditPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/applications/:id/cover-letter',
    element: (
      <ProtectedRoute>
        <CoverLetterPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/interviews',
    element: (
      <ProtectedRoute>
        <InterviewsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/interviews/new',
    element: (
      <ProtectedRoute>
        <NewInterviewPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/interviews/:id',
    element: (
      <ProtectedRoute>
        <InterviewDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: <Navigate to="/settings/profile" replace />,
  },
  {
    path: '/settings/profile',
    element: (
      <ProtectedRoute>
        <SettingsProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/goal',
    element: (
      <ProtectedRoute>
        <SettingsGoalPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings/resume',
    element: (
      <ProtectedRoute>
        <SettingsResumePage />
      </ProtectedRoute>
    ),
  },

  { path: '*', element: <NotFoundPage /> },
]);

function RouteFallback() {
  return <div className="min-h-screen" aria-hidden />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
