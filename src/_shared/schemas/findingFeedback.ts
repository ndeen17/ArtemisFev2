import { z } from 'zod';

/**
 * Phase 0 — Finding-level user feedback.
 *
 * A "finding" is any individual AI-generated item shown to the user that has
 * a stable id: an analysis gap, an analysis suggestion, an analysis strength,
 * or an interview-brief criterion. The user can thumbs-up / thumbs-down any
 * finding to tell us whether it was useful. This signal drives prompt
 * iteration (Phase 1+) and lets us measure outcome quality without running
 * full evals.
 *
 * Kept narrow on purpose: the surface enum is closed; new surfaces require
 * a code change so the analytics rollup stays meaningful.
 */
export const FindingFeedbackSurfaceSchema = z.enum([
  'analysis_gap',
  'analysis_suggestion',
  'analysis_strength',
  'interview_criterion',
]);
export type FindingFeedbackSurface = z.infer<typeof FindingFeedbackSurfaceSchema>;

export const FindingFeedbackVoteSchema = z.enum(['up', 'down']);
export type FindingFeedbackVote = z.infer<typeof FindingFeedbackVoteSchema>;

/** Submission payload — what the FE thumbs widget POSTs. */
export const FindingFeedbackInputSchema = z
  .object({
    surface: FindingFeedbackSurfaceSchema,
    /** Parent artefact id (analysis id, interview brief id, ...). Used to
     *  join feedback back to its source for outcome analysis. */
    surfaceId: z.string().min(1).max(64),
    /** Stable id of the individual finding within the artefact. */
    findingId: z.string().min(1).max(128),
    vote: FindingFeedbackVoteSchema,
    /** Optional short explanation. Capped to keep abuse surface small and
     *  to avoid users dumping PII into feedback. */
    freeText: z.string().trim().max(500).optional(),
  })
  .strict();
export type FindingFeedbackInput = z.infer<typeof FindingFeedbackInputSchema>;
