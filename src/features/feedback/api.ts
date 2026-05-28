import type { FindingFeedbackInput } from '@artemis/shared';
import { apiClient } from '@/lib/apiClient';

/**
 * Phase 0 instrumentation — POST a single thumbs-up/thumbs-down on any
 * AI-generated "finding" (interview-criterion rationale, analysis gap, etc.).
 *
 * Endpoint: POST /findings/feedback → 201 { ok: true }
 *
 * The BE records every submission as its own row (including flip-flops), so
 * the FE is free to re-POST when the user changes their vote. Idempotency
 * (showing the current vote state) is handled client-side.
 */
export const feedbackApi = {
  async submit(input: FindingFeedbackInput): Promise<void> {
    await apiClient.post('/findings/feedback', input);
  },
};
