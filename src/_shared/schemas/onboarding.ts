import { z } from 'zod';

/** Career role the user identifies with (drives copy + analysis weights downstream). */
export const RoleSchema = z.enum([
  'software_engineer',
  'product_manager',
  'designer',
  'data_analyst',
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
    displayName: z.string().trim().min(1).max(80).optional(),
    role: RoleSchema.optional(),
    experienceLevel: ExperienceLevelSchema.optional(),
    goal: GoalSchema.optional(),
    onboardingStep: OnboardingStepSchema.optional(),
    /** Phase 0 — data-usage consent opt-in. Setting `true` stamps
     *  `dataUsageConsentedAt = now` and `dataUsageConsentVersion =
     *  DATA_USAGE_CONSENT_VERSION`. Setting `false` clears both (revocation).
     *  Server is the source of truth for timestamp + version; the client
     *  only sends the boolean. */
    dataUsageConsented: z.boolean().optional(),
  })
  .strict();
export type OnboardingPatchInput = z.infer<typeof OnboardingPatchSchema>;

/** Current data-usage consent text version. Bump when the wording of the
 *  consent prompt materially changes — that invalidates prior consent for
 *  any data-usage job that requires the new version. */
export const DATA_USAGE_CONSENT_VERSION = 'v1-2026-05';

/** Snapshot returned by GET /onboarding — drives the wizard's initial state. */
export const OnboardingStateSchema = z.object({
  displayName: z.string().nullable(),
  role: RoleSchema.nullable(),
  experienceLevel: ExperienceLevelSchema.nullable(),
  goal: GoalSchema.nullable(),
  onboardingStep: OnboardingStepSchema,
  onboardingComplete: z.boolean(),
  hasCv: z.boolean(),
  cvId: z.string().nullable(),
  /** Async job state for `/cv/from-questionnaire` and `/cv/from-jd`. The
   *  endpoints return 202 immediately and run the AI generation in the
   *  background, so the FE polls this to know when the CV is ready or
   *  why it failed. */
  cvGenerationStatus: z.enum(['idle', 'running', 'failed']).default('idle'),
  cvGenerationError: z.string().nullable().default(null),
  /** Phase 0 — null until the user opts in. ISO string timestamp on opt-in. */
  dataUsageConsentedAt: z.string().nullable().default(null),
  /** The consent-version that was current when the user opted in. Null
   *  while `dataUsageConsentedAt` is null. */
  dataUsageConsentVersion: z.string().nullable().default(null),
});
export type OnboardingState = z.infer<typeof OnboardingStateSchema>;
