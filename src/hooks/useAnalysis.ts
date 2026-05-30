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

/**
 * Fetches the latest analysis together with its cohort calibration (#6c) — where
 * the CV's deterministic structural spine sits relative to comparable candidates.
 * Separate query key from {@link useLatestAnalysis} so existing consumers keep
 * their `CvAnalysis`-shaped data; this one carries the `{ analysis, calibration }`
 * envelope. Calibration is `null`/`available:false` until the cohort matures.
 */
export function useLatestCalibration() {
  return useQuery({
    queryKey: ['analysis', 'latest', 'calibration'] as const,
    queryFn: analysisApi.latestWithCalibration,
    staleTime: 5_000,
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
