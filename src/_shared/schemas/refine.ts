import { z } from 'zod';
import { NonEmptyString } from './common.js';
import { StructuredCvSchema } from './cv.js';

/**
 * AI Refine — multi-turn conversation that refines an already-targeted CV.
 *
 * The conversation is driven by structured turns (a discriminated union):
 *   • `question`  — AI asks a multi-choice question; FE renders options as
 *     radio (single) or checkbox (multi) cards. User can also free-text.
 *   • `proposal`  — AI returns an updated StructuredCv plus a rationale +
 *     bullet list of what changed. FE shows a diff preview and an Apply
 *     button. Apply is local-only (mutates the editor draft); the user
 *     still has to hit the page's Save button to persist.
 *   • `done`      — AI signals the refinement loop is complete.
 *
 * History is sent on every request — backend is stateless for this feature.
 */

export const RefineSectionSchema = z.enum([
  'header',
  'summary',
  'experience',
  'education',
  'skills',
]);
export type RefineSection = z.infer<typeof RefineSectionSchema>;

export const RefineQuestionOptionSchema = z.object({
  id: NonEmptyString.max(64),
  label: NonEmptyString.max(120),
  description: z.string().trim().max(240).optional(),
});
export type RefineQuestionOption = z.infer<typeof RefineQuestionOptionSchema>;

export const RefineQuestionTurnSchema = z.object({
  kind: z.literal('question'),
  prompt: NonEmptyString.max(280),
  helper: z.string().trim().max(240).optional(),
  selection: z.enum(['single', 'multi']),
  options: z.array(RefineQuestionOptionSchema).min(2).max(6),
  allowFreeText: z.boolean().default(true),
});
export type RefineQuestionTurn = z.infer<typeof RefineQuestionTurnSchema>;

export const RefineChangeSchema = z.object({
  section: RefineSectionSchema,
  description: NonEmptyString.max(240),
});
export type RefineChange = z.infer<typeof RefineChangeSchema>;

export const RefineProposalTurnSchema = z.object({
  kind: z.literal('proposal'),
  summary: NonEmptyString.max(600),
  changes: z.array(RefineChangeSchema).min(1).max(12),
  updatedStructured: StructuredCvSchema,
});
export type RefineProposalTurn = z.infer<typeof RefineProposalTurnSchema>;

export const RefineDoneTurnSchema = z.object({
  kind: z.literal('done'),
  message: NonEmptyString.max(280),
});
export type RefineDoneTurn = z.infer<typeof RefineDoneTurnSchema>;

export const RefineTurnSchema = z.discriminatedUnion('kind', [
  RefineQuestionTurnSchema,
  RefineProposalTurnSchema,
  RefineDoneTurnSchema,
]);
export type RefineTurn = z.infer<typeof RefineTurnSchema>;

/** A user's reply to the AI's last question. */
export const RefineUserAnswerSchema = z.object({
  /** Option ids the user picked (empty if user only typed free text). */
  selectedIds: z.array(NonEmptyString.max(64)).max(8).default([]),
  /** Optional free-text note the user typed alongside / instead of options. */
  freeText: z.string().trim().max(2000).optional(),
});
export type RefineUserAnswer = z.infer<typeof RefineUserAnswerSchema>;

/**
 * One entry in the rolling history. Either:
 *   • assistant turn (full structured turn payload), or
 *   • user reply (selected option ids + optional free text).
 *
 * We use a discriminated union so the FE can render both consistently and
 * the BE can serialise both back to the model.
 */
export const RefineHistoryEntrySchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('assistant'),
    turn: RefineTurnSchema,
  }),
  z.object({
    role: z.literal('user'),
    answer: RefineUserAnswerSchema,
  }),
]);
export type RefineHistoryEntry = z.infer<typeof RefineHistoryEntrySchema>;

export const RefineRequestSchema = z.object({
  /** Conversation so far. Capped to keep prompts cheap. */
  history: z.array(RefineHistoryEntrySchema).max(40).default([]),
  /**
   * The user's latest reply. Omitted on the very first call (the AI asks the
   * opening question with empty history + no userInput).
   */
  userInput: RefineUserAnswerSchema.optional(),
  /**
   * Current state of the targeted CV in the editor. Sent every turn so the
   * model can propose changes against the user's latest hand-edits.
   */
  currentStructured: StructuredCvSchema,
});
export type RefineRequest = z.infer<typeof RefineRequestSchema>;

export const RefineResponseSchema = z.object({
  turn: RefineTurnSchema,
});
export type RefineResponse = z.infer<typeof RefineResponseSchema>;
