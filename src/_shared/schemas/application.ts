import { z } from 'zod';
import { ObjectIdString } from './common.js';

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
export const DiffSegmentSchema = z.object({
  /** -1 = removal, 0 = unchanged, 1 = addition (matches diff-match-patch convention). */
  op: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
  text: z.string(),
});
export type DiffSegment = z.infer<typeof DiffSegmentSchema>;

export const TargetedCvSchema = z.object({
  /** The new tailored CV text. */
  text: z.string().min(50),
  /** Diff segments comparing base CV → targeted CV. */
  diff: z.array(DiffSegmentSchema),
  /** Short rationale explaining what changed and why. */
  rationale: z.string().min(20).max(800),
});
export type TargetedCv = z.infer<typeof TargetedCvSchema>;

export const CoverLetterSchema = z.object({
  text: z.string().min(50),
  /** Optional one-line tagline used as a subject line / intro hook. */
  hook: z.string().min(5).max(200),
});
export type CoverLetter = z.infer<typeof CoverLetterSchema>;

/** Application list/detail view returned by the API. */
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

/** POST /applications/:id/cover-letter — optional tone hint. */
export const DraftCoverLetterSchema = z
  .object({
    tone: z.enum(['confident', 'warm', 'concise']).optional(),
  })
  .strict();
export type DraftCoverLetterInput = z.infer<typeof DraftCoverLetterSchema>;

// ---------- Misc helpers ----------

export const ApplicationIdParam = z.object({ id: ObjectIdString });
