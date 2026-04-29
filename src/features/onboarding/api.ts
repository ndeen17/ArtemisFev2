import type {
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
