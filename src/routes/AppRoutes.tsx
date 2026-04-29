import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { OnboardingGate } from './OnboardingGate';
import { ProtectedRoute } from './ProtectedRoute';

const LandingPage = lazy(() => import('@/pages/Landing/LandingPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const SignUpPage = lazy(() => import('@/pages/Auth/SignUpPage'));
const SignInPage = lazy(() => import('@/pages/Auth/SignInPage'));
const VerifyEmailPage = lazy(() => import('@/pages/Auth/VerifyEmailPage'));
const GoogleCallbackPage = lazy(() => import('@/pages/Auth/GoogleCallbackPage'));
const RolePage = lazy(() => import('@/pages/Onboarding/RolePage'));
const GoalPage = lazy(() => import('@/pages/Onboarding/GoalPage'));
const CvPage = lazy(() => import('@/pages/Onboarding/CvPage'));
const NoCvPage = lazy(() => import('@/pages/Onboarding/NoCvPage'));
const CvBuilderJdPage = lazy(() => import('@/pages/Onboarding/CvBuilderJdPage'));
const CvBuilderQuestionnairePage = lazy(
  () => import('@/pages/Onboarding/CvBuilderQuestionnairePage'),
);
const CvEditPage = lazy(() => import('@/pages/Onboarding/CvEditPage'));
const ProfileCvEditPage = lazy(() => import('@/pages/Profile/CvEditPage'));
const LinkedInPage = lazy(() => import('@/pages/Onboarding/LinkedInPage'));
const CompletePage = lazy(() => import('@/pages/Onboarding/CompletePage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const CvAnalysisPage = lazy(() => import('@/pages/Profile/CvAnalysisPage'));
const CvRewriterPage = lazy(() => import('@/pages/Profile/CvRewriterPage'));
const LinkedInAnalysisPage = lazy(() => import('@/pages/Profile/LinkedInAnalysisPage'));
const ScoreRevealPage = lazy(() => import('@/pages/Profile/ScoreRevealPage'));
const ActionPlanPage = lazy(() => import('@/pages/Profile/ActionPlanPage'));
const ApplicationsPage = lazy(() => import('@/pages/ApplicationsPage'));
const NewApplicationPage = lazy(() => import('@/pages/Applications/NewApplicationPage'));
const ApplicationDetailPage = lazy(() => import('@/pages/Applications/ApplicationDetailPage'));
const JdTargetPage = lazy(() => import('@/pages/Applications/JdTargetPage'));
const CvReviewPage = lazy(() => import('@/pages/Applications/CvReviewPage'));
const CoverLetterPage = lazy(() => import('@/pages/Applications/CoverLetterPage'));
const InterviewsPage = lazy(() => import('@/pages/InterviewsPage'));
const NewInterviewPage = lazy(() => import('@/pages/Interviews/NewInterviewPage'));
const InterviewDetailPage = lazy(() => import('@/pages/Interviews/InterviewDetailPage'));
const SettingsGoalPage = lazy(() => import('@/pages/Settings/SettingsGoalPage'));

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  // Phase 1: auth surface
  { path: '/signup', element: <SignUpPage /> },
  { path: '/signin', element: <SignInPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },
  { path: '/auth/callback/google', element: <GoogleCallbackPage /> },

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
    path: '/settings/goal',
    element: (
      <ProtectedRoute>
        <SettingsGoalPage />
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
