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
const CvBuilderPage = lazyWithRetry(() => import('@/pages/Onboarding/CvBuilderPage'));
const CvEditPage = lazyWithRetry(() => import('@/pages/Onboarding/CvEditPage'));
const ProfileCvEditPage = lazyWithRetry(() => import('@/pages/Profile/CvEditPage'));
const LinkedInPage = lazyWithRetry(() => import('@/pages/Onboarding/LinkedInPage'));
const CompletePage = lazyWithRetry(() => import('@/pages/Onboarding/CompletePage'));
const DashboardPage = lazyWithRetry(() => import('@/pages/DashboardPage'));
const ProfilePage = lazyWithRetry(() => import('@/pages/ProfilePage'));
const CvRewriterPage = lazyWithRetry(() => import('@/pages/Profile/CvRewriterPage'));
const LinkedInAnalysisPage = lazyWithRetry(() => import('@/pages/Profile/LinkedInAnalysisPage'));
const ScoreRevealPage = lazyWithRetry(() => import('@/pages/Profile/ScoreRevealPage'));
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
const ProfileCvPreviewPage = lazyWithRetry(() => import('@/pages/Profile/CvPreviewPage'));
const TargetedCvPreviewPage = lazyWithRetry(
  () => import('@/pages/Applications/CvPreviewPage'),
);
const CoverLetterPage = lazyWithRetry(() => import('@/pages/Applications/CoverLetterPage'));
const InterviewsPage = lazyWithRetry(() => import('@/pages/InterviewsPage'));
const NewInterviewPage = lazyWithRetry(() => import('@/pages/Interviews/NewInterviewPage'));
const InterviewDetailPage = lazyWithRetry(() => import('@/pages/Interviews/InterviewDetailPage'));
const SettingsGoalPage = lazyWithRetry(() => import('@/pages/Settings/SettingsGoalPage'));
const SettingsCareerPage = lazyWithRetry(() => import('@/pages/Settings/SettingsCareerPage'));
const SettingsProfilePage = lazyWithRetry(() => import('@/pages/Settings/SettingsProfilePage'));
const SettingsResumePage = lazyWithRetry(() => import('@/pages/Settings/SettingsResumePage'));
const SettingsPrivacyPage = lazyWithRetry(() => import('@/pages/Settings/SettingsPrivacyPage'));

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
    // Legacy chooser path — the merged builder always starts at the builder now.
    element: <Navigate to="/onboarding/cv/builder" replace />,
  },
  {
    // Legacy: paste-JD path replaced by the conversational builder.
    path: '/onboarding/cv/jd',
    element: <Navigate to="/onboarding/cv/builder" replace />,
  },
  {
    // Legacy: questionnaire path replaced by the conversational builder.
    path: '/onboarding/cv/basics',
    element: <Navigate to="/onboarding/cv/builder" replace />,
  },
  {
    path: '/onboarding/cv/builder',
    element: (
      <OnboardingGate>
        <CvBuilderPage />
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
    // Legacy route — the CV analysis surface has been folded into the
    // "Score details" accordion on /profile. Keep this redirect so external
    // bookmarks and goal CTAs continue to land on the right content.
    path: '/profile/cv',
    element: <Navigate to="/profile?tab=insights#details" replace />,
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
    path: '/profile/cv/preview',
    element: (
      <ProtectedRoute>
        <ProfileCvPreviewPage />
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
    // Legacy route — the standalone action plan was merged into the main
    // profile page so users see the score, the to-do list, and the details
    // in a single scroll. Redirect to the actions anchor on /profile.
    path: '/profile/action-plan',
    element: <Navigate to="/profile#actions" replace />,
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
    path: '/applications/:id/cv-review/preview',
    element: (
      <ProtectedRoute>
        <TargetedCvPreviewPage />
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
    path: '/settings/career',
    element: (
      <ProtectedRoute>
        <SettingsCareerPage />
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
  {
    path: '/settings/privacy',
    element: (
      <ProtectedRoute>
        <SettingsPrivacyPage />
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
