import type {
  ApplyActionInput,
  BulletPath,
  BulletRewriteResponse,
  CvCoachRequest,
  CvDetail,
  CvFromJdInput,
  CvFromQuestionnaireInput,
  OnboardingPatchInput,
  OnboardingState,
  StructuredCv,
} from '@artemis/shared';
import { apiClient } from '@/lib/apiClient';

/** Typed wrappers around /onboarding and /cv endpoints. */
export const onboardingApi = {
  async getState(): Promise<OnboardingState> {
    const res = await apiClient.get<{ state: OnboardingState }>('/onboarding');
    return res.data.state;
  },
  async patch(input: OnboardingPatchInput): Promise<OnboardingState> {
    const res = await apiClient.patch<{ state: OnboardingState }>('/onboarding', input);
    return res.data.state;
  },
  async complete(): Promise<OnboardingState> {
    const res = await apiClient.post<{ state: OnboardingState }>('/onboarding/complete');
    return res.data.state;
  },
};

export const cvApi = {
  async me(): Promise<CvDetail | null> {
    const res = await apiClient.get<{ cv: CvDetail | null }>('/cv/me');
    return res.data.cv;
  },
  async upload(file: File): Promise<CvDetail> {
    const fd = new FormData();
    fd.append('file', file);
    const res = await apiClient.post<{ cv: CvDetail }>('/cv/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.cv;
  },
  async fromJd(input: CvFromJdInput): Promise<CvDetail> {
    const res = await apiClient.post<{ cv: CvDetail }>('/cv/from-jd', input);
    return res.data.cv;
  },
  async fromQuestionnaire(input: CvFromQuestionnaireInput): Promise<CvDetail> {
    const res = await apiClient.post<{ cv: CvDetail }>('/cv/from-questionnaire', input);
    return res.data.cv;
  },
  async patchStructured(cvId: string, structured: StructuredCv): Promise<CvDetail> {
    const res = await apiClient.patch<{ cv: CvDetail }>(`/cv/${cvId}`, { structured });
    return res.data.cv;
  },
  /** Re-run AI parse on the existing rawText. Used when the upload-time parse failed silently. */
  async reparse(cvId: string): Promise<CvDetail> {
    const res = await apiClient.post<{ cv: CvDetail }>(`/cv/${cvId}/parse`);
    return res.data.cv;
  },
  /** Hard-delete the user's CV. Used by the onboarding "Remove" / start-over flow. */
  async remove(cvId: string): Promise<void> {
    await apiClient.delete(`/cv/${cvId}`);
  },
  /** Targeted bullet rewrite. Returns rewrite payload with `target` populated. */
  async rewriteTargetedBullet(target: BulletPath): Promise<BulletRewriteResponse> {
    const { cvId, expId, bulletIdx } = target;
    const res = await apiClient.post<{ rewrite: BulletRewriteResponse }>(
      `/cv/${cvId}/bullets/${expId}/${bulletIdx}/rewrite`,
      {},
    );
    return res.data.rewrite;
  },
  /** Apply a rewrite (or any text) to a specific bullet path. Re-queues analysis. */
  async applyBullet(target: BulletPath, text: string): Promise<CvDetail> {
    const { cvId, expId, bulletIdx } = target;
    const res = await apiClient.post<{ cv: CvDetail }>(
      `/cv/${cvId}/bullets/${expId}/${bulletIdx}/apply`,
      { text },
    );
    return res.data.cv;
  },
  /**
   * Generic action applier — covers non-bullet ops (rewriteSummary, addSkill,
   * addBullet, updateHeader) plus replaceBullet for callers that prefer the
   * unified shape. Re-queues analysis on success.
   */
  async applyAction(
    cvId: string,
    action: ApplyActionInput,
    actionId?: string,
  ): Promise<CvDetail> {
    const res = await apiClient.post<{ cv: CvDetail }>(
      `/cv/${cvId}/actions/apply`,
      { action, ...(actionId ? { actionId } : {}) },
    );
    return res.data.cv;
  },
  async coach(input: CvCoachRequest): Promise<string> {
    const res = await apiClient.post<{ reply: string }>('/cv/coach', input);
    return res.data.reply;
  },
  pdfUrl(cvId: string): string {
    return `/cv/${cvId}/pdf`;
  },
  async downloadPdf(cvId: string): Promise<Blob> {
    const res = await apiClient.get<Blob>(`/cv/${cvId}/pdf`, { responseType: 'blob' });
    return res.data;
  },
};
