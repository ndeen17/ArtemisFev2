import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ActionPlan } from '@artemis/shared';
import { profileApi } from '@/features/profile/api';

const OVERVIEW_KEY = ['profile', 'overview'] as const;
const PLAN_KEY = ['profile', 'action-plan'] as const;
const CONTINUITY_KEY = ['profile', 'continuity'] as const;

/**
 * Polls the overview every 3s while analysis is queued/running so the score reveal
 * page can transition automatically when the worker finishes.
 */
export function useProfileOverview() {
  return useQuery({
    queryKey: OVERVIEW_KEY,
    queryFn: profileApi.overview,
    staleTime: 5_000,
    refetchInterval: (q) => {
      const status = q.state.data?.analysisStatus;
      return status === 'queued' || status === 'running' ? 3_000 : false;
    },
  });
}

export function useActionPlan() {
  return useQuery({
    queryKey: PLAN_KEY,
    queryFn: profileApi.actionPlan,
    staleTime: 5_000,
  });
}

export function useContinuity() {
  return useQuery({
    queryKey: CONTINUITY_KEY,
    queryFn: profileApi.continuity,
    staleTime: 5_000,
  });
}

export function useToggleAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, complete }: { id: string; complete: boolean }) =>
      profileApi.toggleAction(id, complete),
    onSuccess(plan: ActionPlan) {
      qc.setQueryData(PLAN_KEY, plan);
    },
  });
}

export function useMarkScoreRevealSeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: profileApi.markScoreRevealSeen,
    onMutate() {
      // Optimistically clear firstReveal so the immediate /profile redirect
      // doesn't bounce the user back to the reveal page while the refetch
      // is still in flight.
      qc.setQueryData(OVERVIEW_KEY, (prev: unknown) =>
        prev && typeof prev === 'object'
          ? { ...(prev as Record<string, unknown>), firstReveal: false }
          : prev,
      );
    },
    onSuccess() {
      void qc.invalidateQueries({ queryKey: OVERVIEW_KEY });
    },
  });
}

export function useRewriteBullet() {
  return useMutation({ mutationFn: (bullet: string) => profileApi.rewriteBullet(bullet) });
}
