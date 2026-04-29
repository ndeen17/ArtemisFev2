import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { copyForGoal, type Goal, type GoalCopy, type GoalState } from '@artemis/shared';
import { goalApi } from '@/features/goal/api';

const GOAL_KEY = ['goal'] as const;

/**
 * Read the user's current goal from the server.
 *
 * Goal is the source of truth for goal-aware copy across the app — the dashboard hero,
 * primary CTA, and ActionList ordering all derive from `copyForGoal(state.goal)`.
 */
export function useGoal() {
  return useQuery({
    queryKey: GOAL_KEY,
    queryFn: goalApi.get,
    staleTime: 60_000,
  });
}

export interface ResolvedGoal {
  goal: Goal | null;
  copy: GoalCopy;
  /** True when the user has explicitly picked a goal (not the neutral default). */
  hasGoal: boolean;
}

/** Convenience: returns the resolved copy block. Always renders something usable. */
export function useGoalCopy(): ResolvedGoal {
  const query = useGoal();
  const goal = query.data?.goal ?? null;
  return {
    goal,
    copy: copyForGoal(goal),
    hasGoal: goal !== null,
  };
}

export function useSetGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goal: Goal) => goalApi.set({ goal }),
    onSuccess(state: GoalState) {
      qc.setQueryData(GOAL_KEY, state);
      // Dashboard data depends on the goal — refetch so action ordering and hero copy update.
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
