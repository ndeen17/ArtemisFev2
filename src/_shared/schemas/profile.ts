import { z } from 'zod';

/**
 * Phase 5 — Profile review API contracts.
 *
 * Profile sub-pages (overview, CV analysis, rewriter, action plan, score reveal,
 * LinkedIn placeholder) share a small set of derived shapes that don't belong on the
 * raw CvAnalysis record because they fold in user-specific state (completed actions,
 * scoreRevealSeen flag, LinkedIn placeholder, weekly delta).
 */

/**
 * One row of the deterministic CV rubric. The displayed cvScore is the average
 * of `rubricScore` and the LLM `overallScore`, so users can see exactly which
 * checks are costing them points and drive the score to 100 by completing them.
 */
export const RubricItemSchema = z.object({
  id: z.string().min(1).max(60),
  label: z.string().min(1).max(120),
  weight: z.number().int().min(1).max(50),
  /** Achieved points (0..weight). May be fractional, rounded to 1 decimal. */
  achieved: z.number().min(0),
  hint: z.string().min(1).max(240),
  /** Editor section the user should jump to to fix this item. */
  section: z.enum(['header', 'summary', 'experience', 'education', 'skills']).nullable(),
});
export type RubricItem = z.infer<typeof RubricItemSchema>;

export const ProfileOverviewSchema = z.object({
  cvScore: z.number().int().min(0).max(100).nullable(),
  /** Always null at this phase — LinkedIn ships as "coming soon" only. */
  linkedInScore: z.number().int().min(0).max(100).nullable(),
  /** Blended readiness; equals cvScore when LinkedIn missing. */
  readinessScore: z.number().int().min(0).max(100).nullable(),
  /** Score change vs the user's previous analysis, or null if no prior analysis. */
  weeklyDelta: z.number().int().nullable(),
  /** True the FIRST time the user reaches a 'done' analysis. Server flips it to false after the
   *  reveal page acks. Used to gate ScoreReveal animation (PRF-05). */
  firstReveal: z.boolean(),
  analysisStatus: z.enum(['queued', 'running', 'done', 'failed', 'none']),
  hasCv: z.boolean(),
  hasLinkedIn: z.literal(false),
  /** Deterministic rubric breakdown used to render the score-reveal & profile UI.
   *  Empty array when no analysis is available yet. */
  rubricBreakdown: z.array(RubricItemSchema).default([]),
  /** Pure rubric score 0..100 (without LLM blending) — used by the breakdown UI. */
  rubricScore: z.number().int().min(0).max(100).nullable(),
  /** Raw LLM overallScore 0..100 — kept separate from cvScore so the UI can compare. */
  llmScore: z.number().int().min(0).max(100).nullable(),
});
export type ProfileOverview = z.infer<typeof ProfileOverviewSchema>;

/**
 * A unified action plan item (PRF-06). `id` is a deterministic hash of source+title
 * so completing an action survives re-analysis when the same suggestion re-emerges.
 */
export const ActionPlanItemSchema = z.object({
  id: z.string().min(1).max(80),
  source: z.enum(['cv', 'linkedin']),
  kind: z.enum(['gap', 'suggestion']),
  title: z.string().min(1).max(160),
  detail: z.string().min(1).max(400),
  severity: z.enum(['low', 'medium', 'high']).nullable(),
  completed: z.boolean(),
  /** Editor section this action targets — drives the "Fix in builder" deep link. */
  section: z.enum(['header', 'summary', 'experience', 'education', 'skills']).default('experience'),
  /** Optional bullet text quoted in the action — when present, FE can deep-link a targeted rewrite. */
  quotedBullet: z.string().max(500).nullable().default(null),
});
export type ActionPlanItem = z.infer<typeof ActionPlanItemSchema>;

export const ActionPlanSchema = z.object({
  items: z.array(ActionPlanItemSchema),
  completedCount: z.number().int().min(0),
  totalCount: z.number().int().min(0),
});
export type ActionPlan = z.infer<typeof ActionPlanSchema>;

/**
 * Bullet rewrite (PRF-03). One main rewrite + exactly two alternatives. Validated
 * before being returned to the FE; if the model fails to produce 3 distinct strings
 * the controller returns 502.
 */
export const BulletRewriteRequestSchema = z.object({
  bullet: z.string().min(8).max(500),
});
export type BulletRewriteRequest = z.infer<typeof BulletRewriteRequestSchema>;

/** Pointer to a specific bullet inside the canonical structured CV. */
export const BulletPathSchema = z.object({
  cvId: z.string().min(1),
  expId: z.string().min(1),
  bulletIdx: z.number().int().min(0).max(20),
});
export type BulletPath = z.infer<typeof BulletPathSchema>;

export const BulletRewriteResponseSchema = z.object({
  original: z.string().min(1).max(500),
  main: z.string().min(1).max(500),
  alternatives: z.array(z.string().min(1).max(500)).length(2),
  /** Present when the rewrite was scoped to a specific bullet inside the user's CV.
   *  When null/undefined, the FE renders the legacy free-form rewriter (no Apply CTA). */
  target: BulletPathSchema.nullable().optional(),
});
export type BulletRewriteResponse = z.infer<typeof BulletRewriteResponseSchema>;

/** POST /cv/:cvId/bullets/:expId/:bulletIdx/apply body. */
export const BulletApplySchema = z.object({
  text: z.string().min(1).max(500),
});
export type BulletApplyInput = z.infer<typeof BulletApplySchema>;

/**
 * Generic apply-action input. Powers the action-plan one-click "Fix" for
 * non-bullet operations (summary, skills, header, add-experience, etc).
 *
 * Discriminated by `op`. The bullet ops are still handled by the dedicated
 * bullet endpoints — this schema covers the rest.
 */
export const ApplyActionSchema = z.discriminatedUnion('op', [
  z.object({
    op: z.literal('replaceBullet'),
    expId: z.string().min(1),
    bulletIdx: z.number().int().min(0).max(20),
    text: z.string().min(1).max(500),
  }),
  z.object({
    op: z.literal('addBullet'),
    expId: z.string().min(1),
    text: z.string().min(1).max(500),
  }),
  z.object({
    op: z.literal('rewriteSummary'),
    text: z.string().min(1).max(1500),
  }),
  z.object({
    op: z.literal('addSkill'),
    skill: z.string().trim().min(1).max(60),
  }),
  z.object({
    op: z.literal('updateHeader'),
    patch: z
      .object({
        fullName: z.string().trim().max(120).optional(),
        headline: z.string().trim().max(160).optional(),
        email: z.string().trim().max(160).optional(),
        phone: z.string().trim().max(40).optional(),
        location: z.string().trim().max(160).optional(),
        linkedin: z.string().trim().max(200).optional(),
        website: z.string().trim().max(200).optional(),
      })
      .refine((p) => Object.keys(p).length > 0, 'Empty header patch'),
  }),
]);
export type ApplyActionInput = z.infer<typeof ApplyActionSchema>;

/** Wrapper body for POST /cv/:cvId/actions/apply — the FE may also pass an
 *  `actionId` so the server can record idempotency on the Cv document. */
export const ApplyActionRequestSchema = z.object({
  actionId: z.string().min(1).max(80).optional(),
  action: ApplyActionSchema,
});
export type ApplyActionRequest = z.infer<typeof ApplyActionRequestSchema>;
