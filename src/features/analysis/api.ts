import type { CvAnalysis } from '@artemis/shared';
import { apiClient } from '@/lib/apiClient';

export const analysisApi = {
  async latest(): Promise<CvAnalysis | null> {
    const res = await apiClient.get<{ analysis: CvAnalysis | null }>('/analysis/me/latest');
    return res.data.analysis;
  },
  async refresh(): Promise<CvAnalysis> {
    const res = await apiClient.post<{ analysis: CvAnalysis }>('/analysis/me/refresh');
    return res.data.analysis;
  },
};
