import { z } from 'zod';
import { NonEmptyString } from './common.js';
import { StructuredCvSchema } from './cv.js';

/**
 * Phase-1 CV coach chat. Scoped to the candidate's current CV draft.
 * The FE sends the full draft on every request so the model has fresh context;
 * the BE does NOT persist chat history (kept stateless to ship quickly).
 */
export const CvCoachRoleSchema = z.enum(['user', 'assistant']);
export type CvCoachRole = z.infer<typeof CvCoachRoleSchema>;

export const CvCoachMessageSchema = z.object({
  role: CvCoachRoleSchema,
  content: NonEmptyString.max(2000),
});
export type CvCoachMessage = z.infer<typeof CvCoachMessageSchema>;

/** Which section of the CV the user currently has focus on. */
export const CvCoachSectionSchema = z.enum([
  'header',
  'summary',
  'experience',
  'education',
  'skills',
  'overall',
]);
export type CvCoachSection = z.infer<typeof CvCoachSectionSchema>;

export const CvCoachRequestSchema = z.object({
  cv: StructuredCvSchema,
  /** Active section in the editor — narrows the coach's focus. */
  section: CvCoachSectionSchema.default('overall'),
  /** Conversation so far (excluding the new user message). Capped to keep prompts cheap. */
  history: z.array(CvCoachMessageSchema).max(20).default([]),
  /** The new user message. */
  message: NonEmptyString.max(2000),
});
export type CvCoachRequest = z.infer<typeof CvCoachRequestSchema>;

export const CvCoachResponseSchema = z.object({
  reply: z.string(),
});
export type CvCoachResponse = z.infer<typeof CvCoachResponseSchema>;
