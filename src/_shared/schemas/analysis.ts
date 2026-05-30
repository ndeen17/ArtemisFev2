import { z } from 'zod';

/**
 * CV Analysis (Phase 3).
 *
 * One `CvAnalysis` per `Cv` document. Created in `queued` state when a CV is persisted,
 * picked up by the polling worker, transitioned to `running` while OpenAI is called,
 * then `done` with results or `failed` with an error message.
 *
 * The frontend polls /analysis/me/latest until status is `done` or `failed`.
 */

export const AnalysisStatusSchema = z.enum(['queued', 'running', 'done', 'failed']);
export type AnalysisStatus = z.infer<typeof AnalysisStatusSchema>;

export const AnalysisSeveritySchema = z.enum(['low', 'medium', 'high']);
export type AnalysisSeverity = z.infer<typeof AnalysisSeveritySchema>;

export const AnalysisStrengthSchema = z.object({
  title: z.string().min(1).max(120),
  detail: z.string().min(1).max(400),
});
export type AnalysisStrength = z.infer<typeof AnalysisStrengthSchema>;

/**
 * Where a finding originates, in human terms. Resolved deterministically during
 * synthesis from the user's structured CV (expId → "Title · Company",
 * educationId → "Qualification · School") or the overview section the finding
 * targets (summary / header / skills). Lets the FE label each finding with the
 * exact place it comes from instead of a bare title.
 */
export const AnalysisScopeKindSchema = z.enum([
  'experience',
  'education',
  'summary',
  'header',
  'skills',
  'general',
]);
export type AnalysisScopeKind = z.infer<typeof AnalysisScopeKindSchema>;

export const AnalysisScopeSchema = z.object({
  kind: AnalysisScopeKindSchema,
  /** Human-readable origin, e.g. "Software Engineer · NeedSolution",
   *  "BSc Computer Science · UCL", "Professional summary". */
  label: z.string().min(1).max(160),
});
export type AnalysisScope = z.infer<typeof AnalysisScopeSchema>;

/**
 * Optional reference fields the LLM populates when a finding is item-specific.
 * Validated server-side against the user's structured CV; hallucinated/stale refs
 * are dropped (set to null) before persistence. All four ref fields are nullable so
 * CV-wide findings and legacy analysis documents validate as-is.
 *
 * `scope` is derived (not LLM-supplied) during synthesis and is optional so older
 * persisted analyses without it still validate.
 */
const RefFields = {
  expId: z.string().max(80).nullable().default(null),
  educationId: z.string().max(80).nullable().default(null),
  bulletIndex: z.number().int().min(0).max(50).nullable().default(null),
  quotedBullet: z.string().min(1).max(500).nullable().default(null),
  scope: AnalysisScopeSchema.nullable().optional(),
} as const;

export const AnalysisGapSchema = z.object({
  title: z.string().min(1).max(120),
  detail: z.string().min(1).max(400),
  severity: AnalysisSeveritySchema,
  ...RefFields,
});
export type AnalysisGap = z.infer<typeof AnalysisGapSchema>;

export const AnalysisSuggestionSchema = z.object({
  title: z.string().min(1).max(120),
  detail: z.string().min(1).max(400),
  ...RefFields,
});
export type AnalysisSuggestion = z.infer<typeof AnalysisSuggestionSchema>;

/**
 * Bullet-by-bullet CV feedback (PRF-02).
 * `original` is the bullet as it appears in the CV. `status` flags whether it lands;
 * `suggestion` is a short coaching note. `improvedExample` is an optional inline rewrite
 * the user can drop in directly.
 */
export const BulletStatusSchema = z.enum(['good', 'improve', 'missing']);
export type BulletStatus = z.infer<typeof BulletStatusSchema>;

export const BulletFeedbackSchema = z.object({
  original: z.string().min(1).max(500),
  status: BulletStatusSchema,
  suggestion: z.string().min(1).max(400),
  improvedExample: z.string().min(1).max(500).optional(),
});
export type BulletFeedback = z.infer<typeof BulletFeedbackSchema>;

/** Strict shape we ask OpenAI to produce (JSON mode). Validated server-side before persist. */
export const AnalysisResultSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  headline: z.string().min(1).max(200),
  strengths: z.array(AnalysisStrengthSchema).min(1).max(8),
  gaps: z.array(AnalysisGapSchema).min(1).max(8),
  suggestions: z.array(AnalysisSuggestionSchema).min(1).max(8),
  detectedRoles: z.array(z.string().min(1).max(80)).max(6),
  extractedSkills: z.array(z.string().min(1).max(60)).max(40),
  yearsExperience: z.number().min(0).max(60),
  /** Optional — older analyses won't have it; new ones include up to 12 bullets. */
  bulletFeedback: z.array(BulletFeedbackSchema).max(12).optional(),
  /** Required from Phase 0 onward — keyword gaps drive the deterministic
   *  rubric and the role-aware ATS surfaces. May be empty when the CV
   *  already covers the expected keyword set. */
  keywordGaps: z.array(z.string().min(1).max(60)).max(20).default([]),
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

/** The full analysis record returned from /analysis endpoints. */
export const CvAnalysisSchema = z.object({
  id: z.string(),
  cvId: z.string(),
  status: AnalysisStatusSchema,
  result: AnalysisResultSchema.nullable(),
  error: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CvAnalysis = z.infer<typeof CvAnalysisSchema>;
