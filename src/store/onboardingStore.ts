import { create } from 'zustand';
import type { ExperienceLevel, Goal, OnboardingState, OnboardingStep, Role } from '@artemis/shared';

interface OnboardingStoreState {
  hydrated: boolean;
  step: OnboardingStep;
  role: Role | null;
  experienceLevel: ExperienceLevel | null;
  goal: Goal | null;
  hasCv: boolean;
  cvId: string | null;
  onboardingComplete: boolean;
  hydrate(state: OnboardingState): void;
  reset(): void;
}

const initial: Omit<OnboardingStoreState, 'hydrate' | 'reset'> = {
  hydrated: false,
  step: 'role',
  role: null,
  experienceLevel: null,
  goal: null,
  hasCv: false,
  cvId: null,
  onboardingComplete: false,
};

/**
 * Local mirror of /onboarding state. Hydrated from the server on every wizard
 * mount so a refresh always resumes at the correct step.
 */
export const useOnboardingStore = create<OnboardingStoreState>((set) => ({
  ...initial,
  hydrate(state) {
    set({
      hydrated: true,
      step: state.onboardingStep,
      role: state.role,
      experienceLevel: state.experienceLevel,
      goal: state.goal,
      hasCv: state.hasCv,
      cvId: state.cvId,
      onboardingComplete: state.onboardingComplete,
    });
  },
  reset() {
    set({ ...initial });
  },
}));

/** Map an OnboardingStep onto its URL — used everywhere we navigate the wizard. */
export const stepToPath: Record<OnboardingStep, string> = {
  role: '/onboarding/role',
  goal: '/onboarding/goal',
  cv: '/onboarding/cv',
  no_cv: '/onboarding/no-cv',
  cv_builder_jd: '/onboarding/cv/jd',
  cv_builder_questionnaire: '/onboarding/cv/builder',
  linkedin: '/onboarding/linkedin',
  complete: '/onboarding/complete',
};
