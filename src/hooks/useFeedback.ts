import { useMutation } from '@tanstack/react-query';
import type { FindingFeedbackInput } from '@artemis/shared';
import { feedbackApi } from '@/features/feedback/api';

/**
 * Phase 0 — submit a thumbs vote on an AI finding.
 *
 * The mutation does NOT update any react-query cache: the BE response is
 * just `{ ok: true }` and there is no list view of past votes yet. Consumers
 * track the displayed vote state locally (e.g. component useState) so the
 * UI can flip optimistically; on error we expect the consumer to revert.
 */
export function useSubmitFeedback() {
  return useMutation({
    mutationFn: (input: FindingFeedbackInput) => feedbackApi.submit(input),
  });
}
