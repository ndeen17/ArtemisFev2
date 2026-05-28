import { z } from 'zod';
import { ObjectIdString } from './common.js';

/**
 * Phase 8A — Mock interviews (foundations, text-mode).
 *
 * An interview is always a function of `source × type`. Both are picked at
 * configure time and frozen into the brief — once briefed, neither changes.
 *
 * 8A ships text-mode end-to-end (no realtime voice). The transcript shape is
 * mode-agnostic, so 8C–8F (voice) reuse the same schemas without changes.
 */

// ---------- Source × type matrix ----------

export const INTERVIEW_SOURCES = [
  'application',
  'jd_paste',
  'cv_weakness',
  'role_only',
  'dashboard_cta',
] as const;
export const InterviewSourceSchema = z.enum(INTERVIEW_SOURCES);
export type InterviewSource = (typeof INTERVIEW_SOURCES)[number];

export const INTERVIEW_TYPES = [
  'behavioral',
  'technical_role',
  'system_design',
  'case_study',
  'jd_targeted',
] as const;
export const InterviewTypeSchema = z.enum(INTERVIEW_TYPES);
export type InterviewType = (typeof INTERVIEW_TYPES)[number];

/** Allowed (source, type) combinations. Anything outside this set is rejected by the API. */
export const INTERVIEW_MATRIX: Record<InterviewSource, InterviewType[]> = {
  application: ['behavioral', 'technical_role', 'system_design', 'case_study', 'jd_targeted'],
  jd_paste: ['behavioral', 'technical_role', 'system_design', 'case_study', 'jd_targeted'],
  cv_weakness: ['behavioral', 'technical_role'],
  role_only: ['behavioral', 'technical_role'],
  dashboard_cta: ['behavioral', 'technical_role', 'jd_targeted'],
};

export function isValidInterviewCombo(source: InterviewSource, type: InterviewType): boolean {
  return INTERVIEW_MATRIX[source].includes(type);
}

/** Soft duration cap shown on the brief; voice mode also enforces this server-side. */
export const INTERVIEW_DURATION_MIN: Record<InterviewType, number> = {
  behavioral: 15,
  technical_role: 20,
  system_design: 25,
  case_study: 25,
  jd_targeted: 20,
};

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  behavioral: 'Behavioral',
  technical_role: 'Technical (role)',
  system_design: 'System design',
  case_study: 'Case study',
  jd_targeted: 'JD-targeted mix',
};

export const INTERVIEW_SOURCE_LABELS: Record<InterviewSource, string> = {
  application: 'From a saved application',
  jd_paste: 'Paste a job description',
  cv_weakness: 'Drill my CV gaps',
  role_only: 'Role only (no JD/CV)',
  dashboard_cta: 'From dashboard',
};

// ---------- Status pipeline ----------

export const INTERVIEW_STATUSES = [
  'configuring',
  'briefed',
  'live',
  'scoring',
  'completed',
  'interrupted',
  'abandoned',
] as const;
export const InterviewStatusSchema = z.enum(INTERVIEW_STATUSES);
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

export const INTERVIEW_MODES = ['text', 'voice'] as const;
export const InterviewModeSchema = z.enum(INTERVIEW_MODES);
export type InterviewMode = (typeof INTERVIEW_MODES)[number];

export const INTERVIEW_END_REASONS = [
  'user_ended',
  'time_cap',
  'idle_timeout',
  'connection_lost',
  'tab_closed',
  'error',
] as const;
export const InterviewEndReasonSchema = z.enum(INTERVIEW_END_REASONS);
export type InterviewEndReason = (typeof INTERVIEW_END_REASONS)[number];

// ---------- Brief ----------

export const InterviewCriterionSchema = z.object({
  key: z.string().min(1).max(40),
  label: z.string().min(2).max(80),
  description: z.string().min(10).max(400),
});
export type InterviewCriterion = z.infer<typeof InterviewCriterionSchema>;

export const InterviewBriefSchema = z.object({
  summary: z.string().min(20).max(800),
  criteria: z.array(InterviewCriterionSchema).min(3).max(6),
  expectedDurationMin: z.number().int().min(5).max(45),
  tips: z.array(z.string().min(5).max(240)).min(3).max(6),
  /** Snapshot of the inputs used to generate the brief — for audit + re-score. */
  context: z.object({
    source: InterviewSourceSchema,
    type: InterviewTypeSchema,
    role: z.string().nullable(),
    company: z.string().nullable(),
    jdExcerpt: z.string().nullable(),
    cvExcerpt: z.string().nullable(),
    weaknessKeywords: z.array(z.string()).default([]),
  }),
});
export type InterviewBrief = z.infer<typeof InterviewBriefSchema>;

// ---------- Transcript ----------

export const TranscriptRoleSchema = z.enum(['interviewer', 'candidate']);
export type TranscriptRole = z.infer<typeof TranscriptRoleSchema>;

export const TranscriptTurnSchema = z.object({
  role: TranscriptRoleSchema,
  text: z.string().min(1).max(8000),
  at: z.string(),
  /** Voice mode only — duration of the captured audio for this turn. */
  audioMs: z.number().int().nonnegative().optional(),
  /**
   * Phase D — which bank question this turn was answering (null on legacy
   * free-form LLM turns). Used by Phase E rubric-grounded scoring.
   */
  questionId: z.string().nullable().optional(),
  questionVersion: z.number().int().positive().nullable().optional(),
});
export type TranscriptTurn = z.infer<typeof TranscriptTurnSchema>;

// ---------- Phase D — hybrid interviewer state ----------

export const CurrentQuestionSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  signals: z.array(z.string()),
  /** Candidate turns spent on this question so far. */
  turnsAsked: z.number().int().nonnegative(),
  askedAt: z.string(),
});
export type CurrentQuestion = z.infer<typeof CurrentQuestionSchema>;

export const UsedQuestionSchema = CurrentQuestionSchema.extend({
  advancedAt: z.string(),
  advancedReason: z.enum(['llm_advance', 'turn_cap', 'session_end']),
});
export type UsedQuestion = z.infer<typeof UsedQuestionSchema>;

// ---------- Scoring + debrief ----------

export const CriterionScoreSchema = z.object({
  key: z.string().min(1).max(40),
  label: z.string().min(2).max(80),
  score: z.number().int().min(0).max(100),
  rationale: z.string().min(10).max(600),
});
export type CriterionScore = z.infer<typeof CriterionScoreSchema>;

export const DebriefNextActionSchema = z.object({
  title: z.string().min(4).max(120),
  detail: z.string().min(10).max(400),
  /** Optional deep-link target inside the app. */
  link: z.string().max(200).optional(),
});
export type DebriefNextAction = z.infer<typeof DebriefNextActionSchema>;

export const InterviewDebriefSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  criterionScores: z.array(CriterionScoreSchema).min(3).max(6),
  strengths: z.array(z.string().min(5).max(240)).min(1).max(5),
  weaknesses: z.array(z.string().min(5).max(240)).min(1).max(5),
  nextActions: z.array(DebriefNextActionSchema).min(1).max(5),
});
export type InterviewDebrief = z.infer<typeof InterviewDebriefSchema>;

// ---------- Session shape ----------

export const InterviewSessionSchema = z.object({
  id: z.string(),
  source: InterviewSourceSchema,
  type: InterviewTypeSchema,
  mode: InterviewModeSchema,
  status: InterviewStatusSchema,
  applicationId: z.string().nullable(),
  brief: InterviewBriefSchema.nullable(),
  transcript: z.array(TranscriptTurnSchema),
  /** Phase D — bank question the candidate is currently answering, if any. */
  currentQuestion: CurrentQuestionSchema.nullable(),
  /** Phase D — history of bank questions the candidate has already answered in this session. */
  usedQuestions: z.array(UsedQuestionSchema),
  debrief: InterviewDebriefSchema.nullable(),
  endedReason: InterviewEndReasonSchema.nullable(),
  costCents: z.number().int().nonnegative(),
  startedAt: z.string().nullable(),
  endedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type InterviewSession = z.infer<typeof InterviewSessionSchema>;

export const InterviewSessionSummarySchema = InterviewSessionSchema.pick({
  id: true,
  source: true,
  type: true,
  mode: true,
  status: true,
  createdAt: true,
  endedAt: true,
}).extend({
  overallScore: z.number().int().min(0).max(100).nullable(),
  durationSec: z.number().int().nonnegative().nullable(),
});
export type InterviewSessionSummary = z.infer<typeof InterviewSessionSummarySchema>;

// ---------- Request payloads ----------

export const CreateInterviewSchema = z
  .object({
    source: InterviewSourceSchema,
    type: InterviewTypeSchema,
    mode: InterviewModeSchema.default('text'),
    /** Required when source === 'application'. */
    applicationId: ObjectIdString.optional(),
    /** Required when source === 'jd_paste'. */
    jdText: z.string().trim().min(20).max(20_000).optional(),
    /** Optional role/company hints for role_only / dashboard_cta. */
    role: z.string().trim().min(2).max(120).optional(),
    company: z.string().trim().min(1).max(120).optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    if (!isValidInterviewCombo(val.source, val.type)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['type'],
        message: `Type "${val.type}" is not allowed for source "${val.source}".`,
      });
    }
    if (val.source === 'application' && !val.applicationId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['applicationId'],
        message: 'applicationId is required when source = application.',
      });
    }
    if (val.source === 'jd_paste' && !val.jdText) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['jdText'],
        message: 'jdText is required when source = jd_paste.',
      });
    }
  });
export type CreateInterviewInput = z.infer<typeof CreateInterviewSchema>;

/** 8A text-mode: candidate sends a typed turn, server returns the next interviewer turn. */
export const PostTurnSchema = z
  .object({
    text: z.string().trim().min(1).max(8000),
  })
  .strict();
export type PostTurnInput = z.infer<typeof PostTurnSchema>;

export const EndInterviewSchema = z
  .object({
    reason: InterviewEndReasonSchema.optional(),
  })
  .strict();
export type EndInterviewInput = z.infer<typeof EndInterviewSchema>;

export const InterviewIdParam = z.object({ id: ObjectIdString });
