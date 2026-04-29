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
});
export type CvDetail = z.infer<typeof CvDetailSchema>;

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
});
export type CvFromQuestionnaireInput = z.infer<typeof CvFromQuestionnaireSchema>;
