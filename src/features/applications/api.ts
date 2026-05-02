import type {
  ApplicationStatus,
  ApplicationSummary,
  Application,
  CreateApplicationInput,
  UpdateApplicationInput,
  DraftCoverLetterInput,
  PatchTargetedCvInput,
} from '@artemis/shared';
import { apiClient } from '@/lib/apiClient';

export const applicationApi = {
  async list(status?: ApplicationStatus): Promise<ApplicationSummary[]> {
    const res = await apiClient.get<{ items: ApplicationSummary[] }>('/applications', {
      params: status ? { status } : undefined,
    });
    return res.data.items;
  },
  async get(id: string): Promise<Application> {
    const res = await apiClient.get<{ application: Application }>(`/applications/${id}`);
    return res.data.application;
  },
  async create(input: CreateApplicationInput): Promise<Application> {
    const res = await apiClient.post<{ application: Application }>('/applications', input);
    return res.data.application;
  },
  async update(id: string, patch: UpdateApplicationInput): Promise<Application> {
    const res = await apiClient.patch<{ application: Application }>(`/applications/${id}`, patch);
    return res.data.application;
  },
  async setStatus(id: string, status: ApplicationStatus): Promise<Application> {
    const res = await apiClient.post<{ application: Application }>(`/applications/${id}/status`, {
      status,
    });
    return res.data.application;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/applications/${id}`);
  },
  async targetCv(id: string): Promise<Application> {
    const res = await apiClient.post<{ application: Application }>(`/applications/${id}/target-cv`);
    return res.data.application;
  },
  async draftCoverLetter(id: string, input: DraftCoverLetterInput): Promise<Application> {
    const res = await apiClient.post<{ application: Application }>(
      `/applications/${id}/cover-letter/draft`,
      input,
    );
    return res.data.application;
  },
  async editCoverLetter(id: string, patch: { text: string; hook?: string }): Promise<Application> {
    const res = await apiClient.patch<{ application: Application }>(
      `/applications/${id}/cover-letter`,
      patch,
    );
    return res.data.application;
  },
  async patchTargetedCv(id: string, patch: PatchTargetedCvInput): Promise<Application> {
    const res = await apiClient.patch<{ application: Application }>(
      `/applications/${id}/targeted-cv`,
      patch,
    );
    return res.data.application;
  },
  async reparseTargetedCv(id: string): Promise<Application> {
    const res = await apiClient.post<{ application: Application }>(
      `/applications/${id}/targeted-cv/parse`,
    );
    return res.data.application;
  },
  async downloadTargetedCvPdf(id: string): Promise<Blob> {
    const res = await apiClient.get<Blob>(`/applications/${id}/targeted-cv/pdf`, {
      responseType: 'blob',
    });
    return res.data;
  },
};
