import { useMutation } from '@tanstack/react-query';
import type { RefineRequest, RefineTurn } from '@artemis/shared';
import { applicationApi } from '@/features/applications/api';

/**
 * Single-turn mutation against POST /applications/:id/targeted-cv/refine.
 *
 * The refinement loop is intentionally stateless on the server: caller is
 * responsible for tracking conversation history (we use `refineChatStore`)
 * and re-sending it on every turn. Returns the AI's next turn — either
 * another `question`, a `proposal`, or `done`.
 */
export function useNextRefineTurn(id: string) {
  return useMutation<RefineTurn, Error, RefineRequest>({
    mutationFn: (input) => applicationApi.refineTargetedCv(id, input),
  });
}
