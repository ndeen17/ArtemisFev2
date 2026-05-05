import { z } from 'zod';
import { ObjectIdString } from './common.js';
import { StructuredCvSchema } from './cv.js';

/**
 * Phase 7 — Application tracking.
 *
 * Status pipeline (forward direction implied; users can move backwards too):
 *   saved → applied → interview → offer
 *                                ↘ rejected
 *                                ↘ withdrawn
 *
 * Every status change is appended to `statusHistory` with a server-stamped timestamp
 * so we can render a timeline on the application detail page (and later, weekly progress).
 */

export const APPLICATION_STATUSES = [
  'saved',
  'applied',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
] as const;

export const ApplicationStatusSchema = z.enum(APPLICATION_STATUSES);
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** UI ordering for Kanban columns — matches the hub left → right. */
export const KANBAN_COLUMNS: ApplicationStatus[] = [
  'saved',
  'applied',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interviewing',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const StatusHistoryEntrySchema = z.object({
  status: ApplicationStatusSchema,
  at: z.string(),
});
export type StatusHistoryEntry = z.infer<typeof StatusHistoryEntrySchema>;

/** Diff hunk produced by `targetCv` — character-level diff using diff-match-patch semantics. */
/** Phase 3 — annotation tag attached to addition segments to explain why the AI added the text. */
export const DiffReasonCodeSchema = z.enum([
  'jd_keyword',
  'power_verb',
  'quantification',
  'role_fit',
  'clarity',
  'other',
]);
export type DiffReasonCode = z.infer<typeof DiffReasonCodeSchema>;

export const DiffSegmentSchema = z.object({
  /** -1 = removal, 0 = unchanged, 1 = addition (matches diff-match-patch convention). */
  op: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
  text: z.string(),
  /** Phase 3 — annotation reason code (only meaningful for additions). */
  reasonCode: DiffReasonCodeSchema.optional(),
  /** Phase 3 — short human-readable explanation (e.g. "Mirrors JD keyword: Tableau"). */
  reason: z.string().max(160).optional(),
});
export type DiffSegment = z.infer<typeof DiffSegmentSchema>;

export const TargetedCvSchema = z.object({
  /** The new tailored CV text. */
  text: z.string().min(50),
  /** Diff segments comparing base CV → targeted CV. */
  diff: z.array(DiffSegmentSchema),
  /** Short rationale explaining what changed and why. */
  rationale: z.string().min(20).max(800),
  /** User-friendly label (defaults to "<jobTitle> — <company>"). */
  name: z.string().min(1).max(120).nullable().default(null),
  /** Editable structured shape — same schema as the base CV. Nullable for
   *  legacy applications generated before the structured pipeline existed
   *  and as a graceful fallback when the AI parse step fails. */
  structured: StructuredCvSchema.nullable().default(null),
  /** Phase 2 — deterministic ATS-pass estimate. Recomputed on every regeneration. */
  atsScore: z.lazy(() => AtsScoreSchema).nullable().default(null),
});
export type TargetedCv = z.infer<typeof TargetedCvSchema>;

export const CoverLetterSchema = z.object({
  text: z.string().min(50),
  /** Optional one-line tagline used as a subject line / intro hook. */
  hook: z.string().min(5).max(200),
  /** Phase 2 — keyword-coverage subset of AtsScore. */
  atsScore: z.lazy(() => AtsScoreSchema).nullable().default(null),
});
export type CoverLetter = z.infer<typeof CoverLetterSchema>;

/**
 * Phase 1 — JD Deconstruction Layer.
 *
 * Structured brief extracted from the JD by a dedicated LLM call. Cached on
 * the Application keyed by `jdTextHash` so the extraction runs once per JD
 * and is reused by every downstream JD-aware feature (Targeted CV, Cover
 * Letter, ATS score, annotated diff).
 */
export const KeywordFrequencySchema = z.object({
  term: z.string().min(1).max(80),
  count: z.number().int().min(1).max(50),
});
export type KeywordFrequency = z.infer<typeof KeywordFrequencySchema>;

export const JdAnalysisSchema = z.object({
  /** The role title as stated in the JD — used by the title-mirroring rule. */
  jobTitle: z.string().min(1).max(160),
  /** Must-have keywords/qualifications/tools the JD insists on. */
  hardRequirements: z.array(z.string().min(1).max(120)).max(30).default([]),
  /** Seniority/culture cues that don't gate the application but flavour the fit. */
  softSignals: z.array(z.string().min(1).max(120)).max(20).default([]),
  /** Top keyword frequencies in the JD, sorted desc. Drives Rule C. */
  keywordFrequency: z.array(KeywordFrequencySchema).max(20).default([]),
  /** Requirements implied but not spelled out (e.g. "managed budget" → P&L responsibility). */
  implicitRequirements: z.array(z.string().min(1).max(160)).max(15).default([]),
  /** Optional ATS hints surfaced if the JD itself mentions them. */
  atsHints: z
    .object({
      dateFormatHint: z.string().min(1).max(80).optional(),
      headerStyleHint: z.string().min(1).max(120).optional(),
    })
    .partial()
    .optional(),
});
export type JdAnalysis = z.infer<typeof JdAnalysisSchema>;

/**
 * Phase 2 — ATS Simulation Score.
 *
 * Deterministic estimate computed after `targetCv()` and (in a relaxed form)
 * after `draftCoverLetter()`. Pure function over (StructuredCv | text, JdAnalysis).
 * Surfaced to the user as a 0–100 estimate plus diagnostic sub-scores.
 */
export const TitleAlignmentSchema = z.enum(['exact', 'semantic', 'mismatch']);
export type TitleAlignment = z.infer<typeof TitleAlignmentSchema>;

export const AtsScoreSchema = z.object({
  /** Overall 0–100 ATS-pass estimate. */
  overall: z.number().int().min(0).max(100),
  /** % of `jdAnalysis.hardRequirements` present in the CV. */
  keywordMatchRate: z.number().min(0).max(1),
  /** How the CV title relates to the JD title. */
  titleAlignment: TitleAlignmentSchema,
  /** % of standard ATS section headers present (Summary/Experience/Education/Skills). */
  headerCompliance: z.number().min(0).max(1),
  /** % of role dates in a consistent format. */
  dateConsistency: z.number().min(0).max(1),
  /** % of matched keywords found in EXPERIENCE bullets (not just the skills list). */
  contextualPlacement: z.number().min(0).max(1),
  /** Keywords that appear more than 4 times across the CV. */
  keywordStuffing: z.array(z.string().min(1).max(80)).max(20).default([]),
  /** Top JD keywords missing from the CV. */
  missingTopKeywords: z.array(z.string().min(1).max(80)).max(20).default([]),
  /** ISO timestamp the score was computed. */
  computedAt: z.string(),
});
export type AtsScore = z.infer<typeof AtsScoreSchema>;

/** Application list/detail view returned by the API. */
export const OutcomeSchema = z.object({
  gotInterview: z.boolean().optional(),
  gotOffer: z.boolean().optional(),
  notedAt: z.string().optional(),
});
export type Outcome = z.infer<typeof OutcomeSchema>;

/** Phase 5 — snapshot of which AI rules / prompt version produced the
 *  current artefacts. Populated on every Targeted CV / Cover Letter
 *  generation so we can later correlate rule combinations with outcomes. */
export const AiRulesAppliedSchema = z.object({
  promptVersion: z.string().min(1).max(40),
  atsScoreSnapshot: z.lazy(() => AtsScoreSchema).nullable().optional(),
  jdAnalysisJobTitle: z.string().nullable().optional(),
  generatedAt: z.string(),
  surface: z.enum(['targeted_cv', 'cover_letter']),
});
export type AiRulesApplied = z.infer<typeof AiRulesAppliedSchema>;

export const ApplicationSchema = z.object({
  id: z.string(),
  jobTitle: z.string(),
  company: z.string(),
  jdText: z.string(),
  status: ApplicationStatusSchema,
  statusHistory: z.array(StatusHistoryEntrySchema),
  baseCvId: z.string().nullable(),
  targetedCv: TargetedCvSchema.nullable(),
  coverLetter: CoverLetterSchema.nullable(),
  /** Phase 1 — cached structured brief of the JD. Populated lazily on first
   *  Targeted CV / Cover Letter / ATS score request. Null until then. */
  jdAnalysis: JdAnalysisSchema.nullable().default(null),
  /** Phase 5 — outcome reporting (got interview / got offer). */
  outcome: OutcomeSchema.nullable().default(null),
  /** Phase 5 — snapshot of which AI rules produced the most recent artefact
   *  on each surface. Indexed by surface. */
  aiRulesApplied: z.record(z.string(), AiRulesAppliedSchema).nullable().default(null),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Application = z.infer<typeof ApplicationSchema>;

/** Compact card payload used by the Kanban / list. */
export const ApplicationSummarySchema = ApplicationSchema.pick({
  id: true,
  jobTitle: true,
  company: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  hasTargetedCv: z.boolean(),
  hasCoverLetter: z.boolean(),
});
export type ApplicationSummary = z.infer<typeof ApplicationSummarySchema>;

// ---------- Request payloads ----------

export const CreateApplicationSchema = z
  .object({
    jobTitle: z.string().trim().min(2, 'Job title required').max(120),
    company: z.string().trim().min(1, 'Company required').max(120),
    jdText: z.string().trim().min(20, 'Paste a job description (min 20 chars)').max(20_000),
    status: ApplicationStatusSchema.optional(),
  })
  .strict();
export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;

export const UpdateApplicationSchema = z
  .object({
    jobTitle: z.string().trim().min(2).max(120).optional(),
    company: z.string().trim().min(1).max(120).optional(),
    jdText: z.string().trim().min(20).max(20_000).optional(),
  })
  .strict();
export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>;

export const SetStatusSchema = z
  .object({
    status: ApplicationStatusSchema,
  })
  .strict();
export type SetStatusInput = z.infer<typeof SetStatusSchema>;

/** POST /applications/:id/target-cv — body intentionally empty; service uses stored JD + base CV. */
export const TargetCvRequestSchema = z.object({}).strict();

/** PATCH /applications/:id/targeted-cv — rename and/or replace the structured shape.
 *  At least one of `name` or `structured` must be provided. */
export const PatchTargetedCvSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    structured: StructuredCvSchema.optional(),
  })
  .strict()
  .refine((v) => v.name !== undefined || v.structured !== undefined, {
    message: 'Provide name and/or structured.',
  });
export type PatchTargetedCvInput = z.infer<typeof PatchTargetedCvSchema>;

/** POST /applications/:id/cover-letter — optional tone hint. */
export const DraftCoverLetterSchema = z
  .object({
    tone: z.enum(['confident', 'warm', 'concise']).optional(),
  })
  .strict();
export type DraftCoverLetterInput = z.infer<typeof DraftCoverLetterSchema>;

/** Phase 5 — POST /applications/:id/outcome */
export const SetOutcomeSchema = z
  .object({
    gotInterview: z.boolean().optional(),
    gotOffer: z.boolean().optional(),
  })
  .strict()
  .refine((v) => v.gotInterview !== undefined || v.gotOffer !== undefined, {
    message: 'Provide gotInterview and/or gotOffer.',
  });
export type SetOutcomeInput = z.infer<typeof SetOutcomeSchema>;

// ---------- Misc helpers ----------

export const ApplicationIdParam = z.object({ id: ObjectIdString });
