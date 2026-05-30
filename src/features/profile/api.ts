import type { ProfileOverview, ActionPlan, BulletRewriteResponse, ContinuitySummary } from '@artemis/shared';
import { apiClient } from '@/lib/apiClient';

export const profileApi = {
  async overview(): Promise<ProfileOverview> {
    const res = await apiClient.get<{ overview: ProfileOverview }>('/profile/overview');
    return res.data.overview;
  },
  async actionPlan(): Promise<ActionPlan> {
    const res = await apiClient.get<{ plan: ActionPlan }>('/profile/action-plan');
    return res.data.plan;
  },
  async continuity(): Promise<ContinuitySummary> {
    const res = await apiClient.get<{ continuity: ContinuitySummary }>('/profile/continuity');
    return res.data.continuity;
  },
  async toggleAction(id: string, complete: boolean): Promise<ActionPlan> {
    const res = await apiClient.post<{ plan: ActionPlan }>(`/profile/actions/${id}`, { complete });
    return res.data.plan;
  },
  async markScoreRevealSeen(): Promise<void> {
    await apiClient.post('/profile/score-reveal-seen');
  },
  async rewriteBullet(bullet: string): Promise<BulletRewriteResponse> {
    const res = await apiClient.post<{ rewrite: BulletRewriteResponse }>(
      '/profile/cv/rewrite-bullet',
      { bullet },
    );
    return res.data.rewrite;
  },
};
