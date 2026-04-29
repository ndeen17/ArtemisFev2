import { z } from 'zod';

/**
 * Phase 5 — Profile review API contracts.
 *
 * Profile sub-pages (overview, CV analysis, rewriter, action plan, score reveal,
 * LinkedIn placeholder) share a small set of derived shapes that don't belong on the
 * raw CvAnalysis record because they fold in user-specific state (completed actions,
 * scoreRevealSeen flag, LinkedIn placeholder, weekly delta).
 */

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

export const BulletRewriteResponseSchema = z.object({
  original: z.string().min(1).max(500),
  main: z.string().min(1).max(500),
  alternatives: z.array(z.string().min(1).max(500)).length(2),
});
export type BulletRewriteResponse = z.infer<typeof BulletRewriteResponseSchema>;
