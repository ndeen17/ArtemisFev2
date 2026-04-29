import { z } from 'zod';
import { GoalSchema } from './onboarding.js';

/**
 * Phase 6 — Goal endpoints.
 *
 * GET  /goal        → current goal (or null)
 * PATCH /goal       → set or change the goal (audit-logged)
 */

export const GoalStateSchema = z.object({
  goal: GoalSchema.nullable(),
  /** When the user last changed their goal. Null if never set. */
  goalSetAt: z.string().nullable(),
});
export type GoalState = z.infer<typeof GoalStateSchema>;

export const SetGoalSchema = z
  .object({
    goal: GoalSchema,
  })
  .strict();
export type SetGoalInput = z.infer<typeof SetGoalSchema>;
