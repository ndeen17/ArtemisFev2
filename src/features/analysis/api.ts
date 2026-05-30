import type { CvAnalysis, CalibrationResult } from '@artemis/shared';
import { apiClient } from '@/lib/apiClient';

export interface LatestAnalysis {
  analysis: CvAnalysis | null;
  /** Backlog #6c — cohort-relative calibration of the structural spine.
   *  Null when there's no done analysis with a spine to calibrate. */
  calibration: CalibrationResult | null;
}

export const analysisApi = {
  async latest(): Promise<CvAnalysis | null> {
    const res = await apiClient.get<{ analysis: CvAnalysis | null }>('/analysis/me/latest');
    return res.data.analysis;
  },
  async latestWithCalibration(): Promise<LatestAnalysis> {
    const res = await apiClient.get<{
      analysis: CvAnalysis | null;
      calibration: CalibrationResult | null;
    }>('/analysis/me/latest');
    return { analysis: res.data.analysis, calibration: res.data.calibration ?? null };
  },
  async refresh(): Promise<CvAnalysis> {
    const res = await apiClient.post<{ analysis: CvAnalysis }>('/analysis/me/refresh');
    return res.data.analysis;
  },
};
