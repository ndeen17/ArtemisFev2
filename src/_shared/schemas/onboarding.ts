import { z } from 'zod';

/** Career role the user identifies with (drives copy + analysis weights downstream). */
export const RoleSchema = z.enum([
  'software_engineer',
  'product_manager',
  'designer',
  'data_analyst',
  'marketing',
  'sales',
  'operations',
  'other',
]);
export type Role = z.infer<typeof RoleSchema>;

/** Years-of-experience bucket. */
export const ExperienceLevelSchema = z.enum(['student', 'entry', 'mid', 'senior', 'lead']);
export type ExperienceLevel = z.infer<typeof ExperienceLevelSchema>;

/** Top-level career goal — drives Phase 6 personalisation. */
export const GoalSchema = z.enum(['job_searching', 'levelling_up', 'exploring']);
export type Goal = z.infer<typeof GoalSchema>;

/** Wizard step the user is currently on. Server-persisted so refresh resumes correctly. */
export const OnboardingStepSchema = z.enum([
  'role',
  'goal',
  'cv',
  'no_cv',
  'cv_builder_jd',
  'cv_builder_questionnaire',
  'linkedin',
  'complete',
]);
export type OnboardingStep = z.infer<typeof OnboardingStepSchema>;

/** Patch payload — every field optional so each step can write only what it knows. */
export const OnboardingPatchSchema = z
  .object({
    role: RoleSchema.optional(),
    experienceLevel: ExperienceLevelSchema.optional(),
    goal: GoalSchema.optional(),
    onboardingStep: OnboardingStepSchema.optional(),
  })
  .strict();
export type OnboardingPatchInput = z.infer<typeof OnboardingPatchSchema>;

/** Snapshot returned by GET /onboarding — drives the wizard's initial state. */
export const OnboardingStateSchema = z.object({
  role: RoleSchema.nullable(),
  experienceLevel: ExperienceLevelSchema.nullable(),
  goal: GoalSchema.nullable(),
  onboardingStep: OnboardingStepSchema,
  onboardingComplete: z.boolean(),
  hasCv: z.boolean(),
  cvId: z.string().nullable(),
});
export type OnboardingState = z.infer<typeof OnboardingStateSchema>;
