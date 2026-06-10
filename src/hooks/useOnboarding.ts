import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { OnboardingState } from '@artemis/shared';
import { onboardingApi, cvApi } from '@/features/onboarding/api';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useAuthStore } from '@/store/authStore';

const KEY = ['onboarding', 'state'] as const;
const CV_KEY = ['cv', 'me'] as const;

const CV_GENERATION_POLL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/** Pulls current onboarding state from the server and mirrors it into the store. */
export function useOnboardingState() {
  const hydrate = useOnboardingStore((s) => s.hydrate);
  // Tracks when we started polling for a running CV generation job. Reset to
  // null when the job is no longer running (success, failure, or component
  // remount). Lets us cap total polling time so a stuck backend job doesn't
  // poll indefinitely.
  const pollingStartRef = useRef<number | null>(null);

  const query = useQuery({
    queryKey: KEY,
    queryFn: onboardingApi.getState,
    staleTime: 30_000,
    // Poll while the AI is drafting a CV in the background so the editor
    // page can flip from the "drafting" loader to the editor as soon as
    // the job finishes (success → status='idle', or failure → 'failed').
    refetchInterval: (q) => {
      if (q.state.data?.cvGenerationStatus !== 'running') {
        pollingStartRef.current = null;
        return false;
      }
      if (pollingStartRef.current === null) {
        pollingStartRef.current = Date.now();
      }
      if (Date.now() - pollingStartRef.current > CV_GENERATION_POLL_TIMEOUT_MS) {
        return false;
      }
      return 3000;
    },
  });
  useEffect(() => {
    if (query.data) hydrate(query.data);
  }, [query.data, hydrate]);
  return query;
}

function syncAuthStep(qc: ReturnType<typeof useQueryClient>, state: OnboardingState) {
  // Keep the auth store in lockstep so refreshes / Navbar reflect the latest step.
  const auth = useAuthStore.getState();
  if (auth.user) {
    auth.setUser({
      ...auth.user,
      onboardingStep: state.onboardingStep,
      onboardingComplete: state.onboardingComplete,
    });
  }
  qc.setQueryData(KEY, state);
}

/**
 * Optimistically advance the auth store's onboardingStep without waiting for a
 * server roundtrip. Used right after a CV mutation succeeds: the BE has already
 * advanced the step, so we want the FE gate to reflect that immediately even if
 * the subsequent state refetch races with a cold-start auth refresh.
 */
function nudgeAuthStep(step: OnboardingState['onboardingStep']) {
  const auth = useAuthStore.getState();
  if (auth.user && auth.user.onboardingStep !== step) {
    auth.setUser({ ...auth.user, onboardingStep: step });
  }
}

/** Best-effort fetch of onboarding state with a small retry to absorb cold-start auth races. */
async function refetchOnboardingState(
  qc: ReturnType<typeof useQueryClient>,
): Promise<OnboardingState | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await qc.fetchQuery({ queryKey: KEY, queryFn: onboardingApi.getState });
    } catch {
      if (attempt === 0) await new Promise((r) => setTimeout(r, 600));
    }
  }
  return null;
}

export function usePatchOnboarding() {
  const qc = useQueryClient();
  const hydrate = useOnboardingStore((s) => s.hydrate);
  return useMutation({
    mutationFn: onboardingApi.patch,
    onSuccess(state) {
      hydrate(state);
      syncAuthStep(qc, state);
    },
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  const hydrate = useOnboardingStore((s) => s.hydrate);
  return useMutation({
    mutationFn: onboardingApi.complete,
    onSuccess(state) {
      hydrate(state);
      syncAuthStep(qc, state);
    },
  });
}

export function useMyCv() {
  return useQuery({ queryKey: CV_KEY, queryFn: cvApi.me, staleTime: 30_000 });
}

export function useUploadCv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cvApi.upload,
    async onSuccess() {
      void qc.invalidateQueries({ queryKey: CV_KEY });
      // Fresh CV → fresh analysis. Invalidate so the dashboard / profile
      // re-poll and show the analysing state immediately.
      void qc.invalidateQueries({ queryKey: ['analysis', 'latest'] });
      void qc.invalidateQueries({ queryKey: ['profile', 'overview'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      // The backend advances onboardingStep to 'linkedin' on upload. Mirror that
      // optimistically into the auth store so the route gate doesn't bounce the
      // user back to /onboarding/cv even if the subsequent refetch races with a
      // cold-start auth refresh.
      nudgeAuthStep('linkedin');
      const state = await refetchOnboardingState(qc);
      if (state) syncAuthStep(qc, state);
    },
  });
}

export function useGenerateCvFromJd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cvApi.fromJd,
    async onSuccess() {
      void qc.invalidateQueries({ queryKey: CV_KEY });
      nudgeAuthStep('linkedin');
      const state = await refetchOnboardingState(qc);
      if (state) syncAuthStep(qc, state);
    },
  });
}

export function useGenerateCvFromQuestionnaire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cvApi.fromQuestionnaire,
    async onSuccess() {
      void qc.invalidateQueries({ queryKey: CV_KEY });
      nudgeAuthStep('linkedin');
      const state = await refetchOnboardingState(qc);
      if (state) syncAuthStep(qc, state);
    },
  });
}

/**
 * Form-only path: persist a CV directly from the questionnaire answers.
 * Synchronous (no AI), so the returned CV is final and the editor can
 * mount immediately on success.
 */
export function useCreateCvFromAnswers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cvApi.fromAnswers,
    async onSuccess() {
      void qc.invalidateQueries({ queryKey: CV_KEY });
      const state = await qc.fetchQuery({ queryKey: KEY, queryFn: onboardingApi.getState });
      syncAuthStep(qc, state);
    },
  });
}

export function usePatchCv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      cvId,
      structured,
    }: {
      cvId: string;
      structured: import('@artemis/shared').StructuredCv;
    }) => cvApi.patchStructured(cvId, structured),
    onSuccess() {
      void qc.invalidateQueries({ queryKey: CV_KEY });
      void qc.invalidateQueries({ queryKey: ['analysis', 'latest'] });
      void qc.invalidateQueries({ queryKey: ['profile', 'overview'] });
      void qc.invalidateQueries({ queryKey: ['profile', 'action-plan'] });
    },
  });
}

export function useReparseCv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cvId: string) => cvApi.reparse(cvId),
    onSuccess() {
      void qc.invalidateQueries({ queryKey: CV_KEY });
    },
  });
}

export function useRemoveCv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cvId: string) => cvApi.remove(cvId),
    async onSuccess() {
      void qc.invalidateQueries({ queryKey: CV_KEY });
      void qc.invalidateQueries({ queryKey: ['analysis', 'latest'] });
      void qc.invalidateQueries({ queryKey: ['profile', 'overview'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      // The user is back at the "no CV" state. Refetch onboarding so the
      // route gate sends them back to /onboarding/cv if they were further on.
      const state = await qc.fetchQuery({ queryKey: KEY, queryFn: onboardingApi.getState });
      syncAuthStep(qc, state);
    },
  });
}

export function useRewriteTargetedBullet() {
  return useMutation({
    mutationFn: (target: import('@artemis/shared').BulletPath) =>
      cvApi.rewriteTargetedBullet(target),
  });
}

export function useApplyBullet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      target,
      text,
    }: {
      target: import('@artemis/shared').BulletPath;
      text: string;
    }) => cvApi.applyBullet(target, text),
    onSuccess() {
      void qc.invalidateQueries({ queryKey: CV_KEY });
      void qc.invalidateQueries({ queryKey: ['analysis', 'latest'] });
      void qc.invalidateQueries({ queryKey: ['profile', 'overview'] });
      void qc.invalidateQueries({ queryKey: ['profile', 'action-plan'] });
    },
  });
}

/**
 * Generic action applier — POST /cv/:cvId/actions/apply. Used by the action
 * plan one-click "Fix" for non-bullet ops (rewriteSummary, addSkill,
 * addBullet, updateHeader). On success the canonical CV + downstream
 * analysis/profile queries are invalidated.
 */
export function useApplyAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      cvId,
      action,
      actionId,
    }: {
      cvId: string;
      action: import('@artemis/shared').ApplyActionInput;
      actionId?: string;
    }) => cvApi.applyAction(cvId, action, actionId),
    onSuccess() {
      void qc.invalidateQueries({ queryKey: CV_KEY });
      void qc.invalidateQueries({ queryKey: ['analysis', 'latest'] });
      void qc.invalidateQueries({ queryKey: ['profile', 'overview'] });
      void qc.invalidateQueries({ queryKey: ['profile', 'action-plan'] });
    },
  });
}

export function useCvCoach() {
  return useMutation({
    mutationFn: (input: import('@artemis/shared').CvCoachRequest) => cvApi.coach(input),
  });
}

export function useCvBuilderChat() {
  return useMutation({
    mutationFn: (input: import('@artemis/shared').CvBuilderChatRequest) =>
      cvApi.builderChat(input),
  });
}

export function useCreateBlankCv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (opts: { fullName?: string }) => cvApi.createBlank(opts),
    onSuccess() {
      void qc.invalidateQueries({ queryKey: CV_KEY });
      void qc.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}
