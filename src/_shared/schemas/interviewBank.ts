import { z } from 'zod';
import { InterviewTypeSchema, type InterviewType } from './interview.js';

/**
 * Phase B — Interview question bank.
 *
 * Questions are authored as JSON in `src/_shared/domain/interviewQuestionBank/`,
 * validated against `BankedQuestionSchema`, and seeded into Mongo at boot.
 *
 * The bank is the scoring anchor: every question carries its own rubric so
 * sessions can be scored consistently across time, candidates, and prompt
 * versions. JSON is the source of truth (git-versioned, code-reviewed); Mongo
 * owns runtime usage stats.
 *
 * Design choices:
 * - `id` is human-readable (`beh.ownership.mid.001`) so reviewers can grep.
 * - `version` increments on edit; old session scores keep referencing the
 *   exact `(id, version)` they were scored against. Never break history.
 * - `retiredAt` is soft-delete; the selector excludes retired Qs from new
 *   sessions, but old scores still resolve.
 * - `legalReviewed` is a release gate. No question goes live without
 *   human sign-off (catches discriminatory or illegal prompts).
 */

// ---------- Enums ----------

export const QUESTION_TRACKS = ['swe', 'data', 'pm', 'design', 'generalist'] as const;
export const QuestionTrackSchema = z.enum(QUESTION_TRACKS);
export type QuestionTrack = (typeof QUESTION_TRACKS)[number];

export const QUESTION_LEVELS = ['junior', 'mid', 'senior', 'staff'] as const;
export const QuestionLevelSchema = z.enum(QUESTION_LEVELS);
export type QuestionLevel = (typeof QUESTION_LEVELS)[number];

/**
 * Expected answer shape — drives the deterministic feature extractor that
 * grounds the scorer. `STAR` ⇒ run `answerStarComponents`; `estimation` ⇒
 * future quantitative checker; etc.
 */
export const QUESTION_EXPECTED_SHAPES = [
  'STAR',
  'tradeoff_discussion',
  'estimation',
  'concept_explain',
] as const;
export const QuestionExpectedShapeSchema = z.enum(QUESTION_EXPECTED_SHAPES);
export type QuestionExpectedShape = (typeof QUESTION_EXPECTED_SHAPES)[number];

// ---------- Rubric ----------

/**
 * 0/25/50/75/100 behavioral anchors per signal. Every level must be authored
 * — no "TBD"s in production. Scorer LLM is given these anchors verbatim so
 * scoring is bound to the question.
 */
export const RubricAnchorsSchema = z.object({
  0: z.string().min(10).max(400),
  25: z.string().min(10).max(400),
  50: z.string().min(10).max(400),
  75: z.string().min(10).max(400),
  100: z.string().min(10).max(400),
});
export type RubricAnchors = z.infer<typeof RubricAnchorsSchema>;

export const RubricEntrySchema = z.object({
  signal: z.string().min(2).max(40),
  levels: RubricAnchorsSchema,
});
export type RubricEntry = z.infer<typeof RubricEntrySchema>;

// ---------- BankedQuestion ----------

/**
 * Runtime stats — populated by analytics pipeline post-launch. Optional on
 * read; the seeder never writes these (they're computed from session data).
 */
export const BankedQuestionStatsSchema = z.object({
  avgScore: z.number().min(0).max(100),
  usageCount: z.number().int().nonnegative(),
  /** Classic test-theory discrimination index. Flag low-discrimination Qs. */
  discriminationIndex: z.number().min(-1).max(1).optional(),
});
export type BankedQuestionStats = z.infer<typeof BankedQuestionStatsSchema>;

export const BankedQuestionSchema = z.object({
  id: z
    .string()
    .min(6)
    .max(80)
    .regex(/^[a-z0-9._-]+$/, 'id must be lowercase alphanumeric with . _ - only'),
  version: z.number().int().positive(),
  type: InterviewTypeSchema,
  track: QuestionTrackSchema,
  level: QuestionLevelSchema,
  /** Signals this question tests. Each must have a matching `rubric` entry. */
  signals: z.array(z.string().min(2).max(40)).min(1).max(6),
  prompt: z.string().min(20).max(800),
  rubric: z.array(RubricEntrySchema).min(1).max(6),
  followUpHints: z.array(z.string().min(5).max(200)).min(1).max(5),
  expectedShape: QuestionExpectedShapeSchema,
  timeBoxMin: z.number().int().min(1).max(20),
  legalReviewed: z.boolean(),
  retiredAt: z.string().datetime().nullable().optional(),
  stats: BankedQuestionStatsSchema.optional(),
});
export type BankedQuestion = z.infer<typeof BankedQuestionSchema>;

/**
 * Cross-field invariant: every signal listed must have a rubric entry. The
 * schema does not encode this (zod struggles with cross-field refinements
 * across arrays), so callers should run `validateBankedQuestionInvariants`.
 */
export function validateBankedQuestionInvariants(q: BankedQuestion): string[] {
  const errors: string[] = [];
  const rubricSignals = new Set(q.rubric.map((r) => r.signal));
  for (const s of q.signals) {
    if (!rubricSignals.has(s)) {
      errors.push(`signal "${s}" has no matching rubric entry`);
    }
  }
  return errors;
}

export type { InterviewType };
