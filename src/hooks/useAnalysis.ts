import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { analysisApi } from '@/features/analysis/api';

const KEY = ['analysis', 'latest'] as const;

/**
 * Fetches the user's latest CV analysis. Polls every 3s while status is queued or
 * running so the dashboard updates as soon as the worker finishes (no websockets needed).
 */
export function useLatestAnalysis() {
  return useQuery({
    queryKey: KEY,
    queryFn: analysisApi.latest,
    staleTime: 5_000,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'queued' || status === 'running' ? 3_000 : false;
    },
  });
}

export function useRefreshAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: analysisApi.refresh,
    onSuccess(data) {
      qc.setQueryData(KEY, data);
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
