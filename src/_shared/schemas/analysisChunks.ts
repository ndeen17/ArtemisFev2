import { z } from 'zod';
import { AnalysisSeveritySchema, BulletStatusSchema, FindingCategorySchema } from './analysis.js';

/**
 * Analysis v3 — decomposed map-reduce schemas.
 *
 * v2 sent the entire CV to one LLM call and trusted it to be specific. v3
 * splits the CV into chunks (one per experience role, one per education
 * entry, one for the non-list sections) and asks the model about ONE chunk
 * at a time. Each chunk's response schema REQUIRES the scope id, so the
 * model literally cannot return an unanchored finding via OpenAI's
 * `response_format: { type: 'json_schema', strict: true }`. Specificity
 * stops being a behavioural ask and becomes a structural guarantee.
 *
 * These schemas are the **chunk-level** responses. A deterministic synthesis
 * step (see services/analysis/synthesise.ts in a later phase) merges them
 * into the existing `AnalysisResultSchema` so downstream consumers
 * (profile.service, FE components) need zero changes.
 *
 * Mirror procedure: any edit here MUST be `Copy-Item -Force`d to the FE
 * mirror at `ArtemisFev2/src/_shared/schemas/analysisChunks.ts` because the
 * `@artemis/shared` import on the FE is a Vite alias to its own _shared
 * copy — there is no real workspace package linking them.
 */

// --------------------------------------------------------------------------
// Per-role analysis (one call per experience entry)
// --------------------------------------------------------------------------

/**
 * A gap or suggestion scoped to ONE experience role. The role's id is
 * REQUIRED (z.string().min(1), not nullable) because the LLM is given
 * exactly one role's text — there is no ambiguity to model. If the strict
 * schema mode is on (it must be), OpenAI rejects responses missing this
 * field before they reach us.
 *
 * `bulletIndex` and `quotedBullet` remain nullable for findings that apply
 * to the role as a whole (e.g. "this role lacks any quantified bullets")
 * rather than one specific line.
 */
export const RoleFindingSchema = z.object({
  title: z.string().min(1).max(120),
  detail: z.string().min(1).max(400),
  /** REQUIRED stable finding kind. Forced by strict json_schema so every
   *  finding is classified at the source; carried through synthesis to key
   *  the cross-analysis diff. */
  category: FindingCategorySchema,
  /** Severity is only meaningful for gaps; suggestions ignore it. We keep
   *  the field on both shapes so the synthesis step can treat them
   *  uniformly without branching. */
  severity: AnalysisSeveritySchema.nullable().default(null),
  /** REQUIRED. The id of the experience role this finding belongs to.
   *  Always equal to the role passed in the request envelope. */
  expId: z.string().min(1).max(80),
  /** Optional — set when the finding concerns one specific bullet. */
  bulletIndex: z.number().int().min(0).max(50).nullable().default(null),
  /** Optional — verbatim substring of the bullet text, for FE highlighting.
   *  Server confirms it appears in the resolved bullet before persisting. */
  quotedBullet: z.string().min(1).max(500).nullable().default(null),
});
export type RoleFinding = z.infer<typeof RoleFindingSchema>;

/** Per-bullet feedback inside a role response. Same shape as the v2
 *  BulletFeedbackSchema but adds the REQUIRED bullet index so synthesis
 *  can attach it to the right line without re-scanning. */
export const RoleBulletFeedbackSchema = z.object({
  bulletIndex: z.number().int().min(0).max(50),
  original: z.string().min(1).max(500),
  status: BulletStatusSchema,
  suggestion: z.string().min(1).max(400),
  improvedExample: z.string().min(1).max(500).nullable().default(null),
});
export type RoleBulletFeedback = z.infer<typeof RoleBulletFeedbackSchema>;

/** Full response shape for one role-level LLM call. */
export const RoleFindingsSchema = z.object({
  expId: z.string().min(1).max(80),
  /** 0-100 internal score for this role; synthesis weights these into the
   *  CV-wide score. Optional so the prompt can omit it for tiny roles. */
  roleScore: z.number().int().min(0).max(100).nullable().default(null),
  gaps: z.array(RoleFindingSchema).max(5).default([]),
  suggestions: z.array(RoleFindingSchema).max(5).default([]),
  bulletFeedback: z.array(RoleBulletFeedbackSchema).max(8).default([]),
});
export type RoleFindings = z.infer<typeof RoleFindingsSchema>;

// --------------------------------------------------------------------------
// Per-education analysis (one call per education entry)
// --------------------------------------------------------------------------

export const EducationFindingSchema = z.object({
  title: z.string().min(1).max(120),
  detail: z.string().min(1).max(400),
  /** REQUIRED stable finding kind (see {@link FindingCategorySchema}). */
  category: FindingCategorySchema,
  severity: AnalysisSeveritySchema.nullable().default(null),
  /** REQUIRED. The id of the education entry this finding belongs to. */
  educationId: z.string().min(1).max(80),
});
export type EducationFinding = z.infer<typeof EducationFindingSchema>;

export const EducationFindingsSchema = z.object({
  educationId: z.string().min(1).max(80),
  gaps: z.array(EducationFindingSchema).max(3).default([]),
  suggestions: z.array(EducationFindingSchema).max(3).default([]),
});
export type EducationFindings = z.infer<typeof EducationFindingsSchema>;

// --------------------------------------------------------------------------
// Overview analysis (one call covering summary + header + skills + CV-wide verdict)
// --------------------------------------------------------------------------

/**
 * Findings about the non-list sections (summary, header, skills). These
 * sections have at most one instance each, so per-item ids are unnecessary
 * — the `section` discriminator is enough.
 */
export const OverviewFindingSchema = z.object({
  title: z.string().min(1).max(120),
  detail: z.string().min(1).max(400),
  /** REQUIRED stable finding kind (see {@link FindingCategorySchema}). */
  category: FindingCategorySchema,
  severity: AnalysisSeveritySchema.nullable().default(null),
  /** Which non-list section this finding concerns. */
  section: z.enum(['summary', 'header', 'skills']),
});
export type OverviewFinding = z.infer<typeof OverviewFindingSchema>;

/**
 * The overview call also produces the CV-wide verdict bits the per-role
 * calls cannot see: an aggregated headline, a baseline overall score, the
 * detected role family, the extracted skills list, and the keyword gaps.
 * These flow straight through synthesis into the existing AnalysisResult.
 */
export const OverviewFindingsSchema = z.object({
  /** 0-100 score for the non-list sections. Synthesis blends with per-role
   *  roleScores to produce the final overallScore. */
  baseScore: z.number().int().min(0).max(100),
  /** One-line CV verdict used as the headline. */
  headline: z.string().min(1).max(200),
  gaps: z.array(OverviewFindingSchema).max(5).default([]),
  suggestions: z.array(OverviewFindingSchema).max(5).default([]),
  /** Cross-CV signals — same shape and constraints as today. */
  detectedRoles: z.array(z.string().min(1).max(80)).max(6).default([]),
  extractedSkills: z.array(z.string().min(1).max(60)).max(40).default([]),
  yearsExperience: z.number().min(0).max(60).nullable().default(null),
  keywordGaps: z.array(z.string().min(1).max(60)).max(20).default([]),
  /** A small set of CV-wide strengths surfaced by the overview pass.
   *  Per-role strengths (if any) are also produced and merged in synthesis. */
  strengths: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        detail: z.string().min(1).max(400),
      }),
    )
    .max(5)
    .default([]),
});
export type OverviewFindings = z.infer<typeof OverviewFindingsSchema>;
