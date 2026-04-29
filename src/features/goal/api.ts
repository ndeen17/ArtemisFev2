import type { GoalState, SetGoalInput } from '@artemis/shared';
import { apiClient } from '@/lib/apiClient';

export const goalApi = {
  async get(): Promise<GoalState> {
    const res = await apiClient.get<{ state: GoalState }>('/goal');
    return res.data.state;
  },
  async set(input: SetGoalInput): Promise<GoalState> {
    const res = await apiClient.patch<{ state: GoalState }>('/goal', input);
    return res.data.state;
  },
};
