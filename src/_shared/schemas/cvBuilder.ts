import { z } from 'zod';
import { NonEmptyString } from './common.js';
import { StructuredCvSchema } from './cv.js';

/**
 * CV Builder chat — onboarding "I don't have a CV" replacement.
 *
 * The user lands in a CV editor + AI chatbot side-by-side. The bot helps
 * them populate their CV section by section. To prevent fabrication the
 * AI never auto-applies anything — it returns structured `actions[]` that
 * the FE renders as Apply / Dismiss cards. Each action carries the minimum
 * payload required to mutate the StructuredCv via a pure reducer.
 */

export const BuilderChatRoleSchema = z.enum(['user', 'assistant']);
export type BuilderChatRole = z.infer<typeof BuilderChatRoleSchema>;

export const BuilderChatMessageSchema = z.object({
  role: BuilderChatRoleSchema,
  content: NonEmptyString.max(2000),
});
export type BuilderChatMessage = z.infer<typeof BuilderChatMessageSchema>;

// ----- Action payloads -------------------------------------------------------

const HeaderPatchSchema = z
  .object({
    fullName: z.string().trim().max(120).optional(),
    headline: z.string().trim().max(160).optional(),
    email: z.string().trim().max(160).optional(),
    phone: z.string().trim().max(40).optional(),
    location: z.string().trim().max(160).optional(),
    linkedin: z.string().trim().max(200).optional(),
    website: z.string().trim().max(200).optional(),
  })
  .strict();

const ExperiencePatchSchema = z
  .object({
    title: z.string().trim().max(120).optional(),
    company: z.string().trim().max(120).optional(),
    location: z.string().trim().max(120).optional(),
    startDate: z.string().trim().max(20).optional(),
    endDate: z.string().trim().max(20).optional(),
    current: z.boolean().optional(),
    achievements: z.array(z.string().trim().min(1).max(500)).max(12).optional(),
  })
  .strict();

const EducationPatchSchema = z
  .object({
    school: z.string().trim().max(160).optional(),
    qualification: z.string().trim().max(160).optional(),
    startDate: z.string().trim().max(20).optional(),
    endDate: z.string().trim().max(20).optional(),
    detail: z.string().trim().max(400).optional(),
  })
  .strict();

export const BuilderActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('setHeader'),
    label: z.string().trim().min(1).max(160),
    patch: HeaderPatchSchema,
  }),
  z.object({
    type: z.literal('setSummary'),
    label: z.string().trim().min(1).max(160),
    summary: z.string().trim().min(1).max(1500),
  }),
  z.object({
    type: z.literal('addExperience'),
    label: z.string().trim().min(1).max(160),
    experience: ExperiencePatchSchema,
  }),
  z.object({
    type: z.literal('updateExperience'),
    label: z.string().trim().min(1).max(160),
    /** Either the experience id or 0-based index. id wins if both supplied. */
    experienceId: z.string().trim().min(1).max(80).optional(),
    experienceIndex: z.number().int().nonnegative().optional(),
    patch: ExperiencePatchSchema,
  }),
  z.object({
    type: z.literal('addBullet'),
    label: z.string().trim().min(1).max(160),
    experienceId: z.string().trim().min(1).max(80).optional(),
    experienceIndex: z.number().int().nonnegative().optional(),
    bullet: z.string().trim().min(1).max(500),
  }),
  z.object({
    type: z.literal('addEducation'),
    label: z.string().trim().min(1).max(160),
    education: EducationPatchSchema,
  }),
  z.object({
    type: z.literal('updateEducation'),
    label: z.string().trim().min(1).max(160),
    educationId: z.string().trim().min(1).max(80).optional(),
    educationIndex: z.number().int().nonnegative().optional(),
    patch: EducationPatchSchema,
  }),
  z.object({
    type: z.literal('addSkill'),
    label: z.string().trim().min(1).max(160),
    skill: z.string().trim().min(1).max(60),
  }),
  z.object({
    type: z.literal('addSkills'),
    label: z.string().trim().min(1).max(160),
    skills: z.array(z.string().trim().min(1).max(60)).min(1).max(20),
  }),
]);
export type BuilderAction = z.infer<typeof BuilderActionSchema>;

// ----- Request / response ----------------------------------------------------

export const CvBuilderBlankRequestSchema = z.object({
  fullName: z.string().trim().max(120).optional(),
});
export type CvBuilderBlankRequest = z.infer<typeof CvBuilderBlankRequestSchema>;

export const CvBuilderChatRequestSchema = z.object({
  /** Full draft so the AI has fresh context — BE does not store chat state. */
  cv: StructuredCvSchema,
  history: z.array(BuilderChatMessageSchema).max(30).default([]),
  message: NonEmptyString.max(2000),
  /** Optional JD the user pasted in the chat to inform suggestions. */
  jobDescription: z.string().trim().max(8000).optional(),
});
export type CvBuilderChatRequest = z.infer<typeof CvBuilderChatRequestSchema>;

export const CvBuilderChatResponseSchema = z.object({
  reply: z.string(),
  actions: z.array(BuilderActionSchema).default([]),
});
export type CvBuilderChatResponse = z.infer<typeof CvBuilderChatResponseSchema>;
