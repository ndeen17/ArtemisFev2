import { z } from 'zod';
import { NonEmptyString } from './common.js';

/** How the canonical CV came into existence. */
export const CvSourceSchema = z.enum(['upload', 'jd', 'questionnaire']);
export type CvSource = z.infer<typeof CvSourceSchema>;

export const MAX_CV_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_CV_MIME = ['application/pdf', 'text/plain'] as const;

/** CV summary returned by /cv endpoints (no rawText to keep payloads small). */
export const CvSummarySchema = z.object({
  id: z.string(),
  filename: z.string().nullable(),
  source: CvSourceSchema,
  charCount: z.number().int().nonnegative(),
  sizeBytes: z.number().int().nonnegative().nullable(),
  createdAt: z.string(),
});
export type CvSummary = z.infer<typeof CvSummarySchema>;

/** Full CV payload (with text) — used by editor / rewriter (Phase 5). */
export const CvDetailSchema = CvSummarySchema.extend({
  rawText: z.string(),
  /** Structured representation used by the interactive editor + live preview.
   *  Optional for legacy uploaded CVs that haven't been parsed yet. */
  structured: z.lazy(() => StructuredCvSchema).nullable().optional(),
});
export type CvDetail = z.infer<typeof CvDetailSchema>;

/** Structured CV shape used by the interactive editor + live preview.
 *  All string fields are optional/empty-allowed so the editor can hold
 *  in-progress state. Validation tightens at save time on the BE if needed. */
export const StructuredCvHeaderSchema = z.object({
  fullName: z.string().trim().max(120).default(''),
  headline: z.string().trim().max(160).default(''),
  email: z.string().trim().max(160).default(''),
  phone: z.string().trim().max(40).default(''),
  location: z.string().trim().max(160).default(''),
  linkedin: z.string().trim().max(200).default(''),
  website: z.string().trim().max(200).default(''),
});
export type StructuredCvHeader = z.infer<typeof StructuredCvHeaderSchema>;

export const StructuredCvExperienceSchema = z.object({
  id: z.string(),
  title: z.string().trim().max(120).default(''),
  company: z.string().trim().max(120).default(''),
  location: z.string().trim().max(120).default(''),
  startDate: z.string().trim().max(20).default(''),
  endDate: z.string().trim().max(20).default(''),
  current: z.boolean().default(false),
  achievements: z.array(z.string().trim().max(500)).max(12).default([]),
});
export type StructuredCvExperience = z.infer<typeof StructuredCvExperienceSchema>;

export const StructuredCvEducationSchema = z.object({
  id: z.string(),
  school: z.string().trim().max(160).default(''),
  qualification: z.string().trim().max(160).default(''),
  startDate: z.string().trim().max(20).default(''),
  endDate: z.string().trim().max(20).default(''),
  detail: z.string().trim().max(400).default(''),
});
export type StructuredCvEducation = z.infer<typeof StructuredCvEducationSchema>;

export const StructuredCvSchema = z.object({
  header: StructuredCvHeaderSchema,
  summary: z.string().trim().max(1500).default(''),
  experience: z.array(StructuredCvExperienceSchema).max(15).default([]),
  education: z.array(StructuredCvEducationSchema).max(8).default([]),
  skills: z.array(z.string().trim().max(60)).max(40).default([]),
});
export type StructuredCv = z.infer<typeof StructuredCvSchema>;

/** Patch payload for PATCH /cv/:id. All sections optional so the FE can do
 *  partial updates as the user moves through the editor. */
export const CvPatchSchema = z.object({
  structured: StructuredCvSchema,
});
export type CvPatchInput = z.infer<typeof CvPatchSchema>;

/** ONB-06A: paste a JD, get a CV draft. */
export const CvFromJdSchema = z.object({
  jobDescription: NonEmptyString.min(100, 'Paste at least 100 characters of the job description'),
});
export type CvFromJdInput = z.infer<typeof CvFromJdSchema>;

/** ONB-06B: structured answers used to draft a CV. All sections optional except the basics. */
export const QuestionnaireAnswersSchema = z.object({
  fullName: NonEmptyString.max(120),
  headline: z.string().trim().max(160).optional().or(z.literal('')),
  summary: z.string().trim().max(1000).optional().or(z.literal('')),
  experience: z
    .array(
      z.object({
        title: NonEmptyString.max(120),
        company: NonEmptyString.max(120),
        startDate: z.string().trim().max(20).optional().or(z.literal('')),
        endDate: z.string().trim().max(20).optional().or(z.literal('')),
        achievements: z.array(z.string().trim().min(1).max(400)).max(8).default([]),
      }),
    )
    .max(10)
    .default([]),
  education: z
    .array(
      z.object({
        school: NonEmptyString.max(120),
        qualification: z.string().trim().max(120).optional().or(z.literal('')),
        year: z.string().trim().max(20).optional().or(z.literal('')),
      }),
    )
    .max(6)
    .default([]),
  skills: z.array(z.string().trim().min(1).max(60)).max(40).default([]),
});
export type QuestionnaireAnswers = z.infer<typeof QuestionnaireAnswersSchema>;

export const CvFromQuestionnaireSchema = z.object({
  answers: QuestionnaireAnswersSchema,
  /** Optional JD pasted on the second step of the merged builder flow.
   *  When present the AI is instructed to tailor the draft to it; when
   *  absent we generate a generic CV from the answers alone. */
  jobDescription: z
    .string()
    .trim()
    .min(100, 'Paste at least 100 characters of the job description')
    .max(6000)
    .optional(),
});
export type CvFromQuestionnaireInput = z.infer<typeof CvFromQuestionnaireSchema>;
