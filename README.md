# @artemis/frontend (ArtemisFev2)

React 18 + TypeScript + Vite + Tailwind frontend 

## Folder structure

```
src/
  components/
    ui/           Button, Input, Card, Badge, Progress, Skeleton, ...   (design system primitives)
    layout/       MarketingLayout, AuthLayout, AppShell                 (page chrome)
    landing/      Hero, Navbar, ValueProp, FeatureRow, Difference, FinalCTA, Footer
    auth/         SignUpForm, SignInForm, ...                           (Phase 1)
    onboarding/   StepHeader, RoleCard, CVUploader, ...                 (Phase 2)
    dashboard/    ReadinessScoreCard, ActionList, ...                   (Phase 4)
    profile/      CVAnalysisPanel, CVRewriter, ScoreReveal, ...         (Phase 5)
    applications/ ApplicationCard, JDTargetForm, CVDiffViewer, ...      (Phase 7)
    interviews/   InterviewBriefPanel, LiveInterviewStage, ...          (Phase 8)
  features/       Per-domain hooks + API wrappers (auth, onboarding, ...)
  pages/          Route-level page components (Landing, SignUp, Dashboard, ...)
  routes/         AppRoutes, ProtectedRoute, OnboardingGate
  lib/            apiClient, queryClient, cn (shadcn helper)
  store/          Zustand stores (authStore, onboardingStore, ...)
  schemas/        Re-exports of @artemis/shared Zod schemas
  hooks/          Cross-cutting hooks
  test/           Vitest setup
```

## Naming conventions

- `*Card` — bounded UI block (e.g. `ReadinessScoreCard`)
- `*Panel` — expandable section (e.g. `CVAnalysisPanel`)
- `*Form` — controlled form (e.g. `SignUpForm`)
- `*Stage` — full-screen experience (e.g. `LiveInterviewStage`)
- `*State` — empty / loading / error variants
- Pages: `pages/<Domain>/<Name>Page.tsx` with one default export

## Setup

```bash
cp .env.example .env.local
npm install                # from repo root (workspaces)
npm run build:shared       # from repo root, once
npm run dev                # http://localhost:5173
```

Dev server proxies `/api/*` to the backend on `http://localhost:4000`.

## Scripts

| Command             | Description                   |
| ------------------- | ----------------------------- |
| `npm run dev`       | Vite dev server               |
| `npm run build`     | Type-check + production build |
| `npm run typecheck` | TypeScript only               |
| `npm run lint`      | ESLint                        |
| `npm run test`      | Vitest                        |
