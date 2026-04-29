import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const LandingPage = lazy(() => import('@/pages/Landing/LandingPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

/**
 * Top-level route table.
 *
 * Route groups (filled out across phases):
 * - Public:        `/`, `/signin`, `/signup`, `/verify-email`
 * - Onboarding:    `/onboarding/*`              (auth required, !onboardingComplete)
 * - App:           `/dashboard`, `/profile/*`, `/applications/*`, `/interviews/*`, `/settings/*`
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  // Phase 1: /signup, /signin, /verify-email
  // Phase 2: /onboarding/*
  // Phase 4: /dashboard
  // Phase 5: /profile/*
  // Phase 7: /applications/*
  // Phase 8: /interviews/*
  {
    path: '*',
    element: <NotFoundPage />,
  },
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
