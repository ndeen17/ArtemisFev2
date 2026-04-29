import type {
  CreateInterviewInput,
  EndInterviewInput,
  InterviewSession,
  InterviewSessionSummary,
  PostTurnInput,
} from '@artemis/shared';
import { apiClient } from '@/lib/apiClient';

export const interviewApi = {
  async list(): Promise<InterviewSessionSummary[]> {
    const res = await apiClient.get<{ items: InterviewSessionSummary[] }>('/interviews');
    return res.data.items;
  },
  async get(id: string): Promise<InterviewSession> {
    const res = await apiClient.get<{ interview: InterviewSession }>(`/interviews/${id}`);
    return res.data.interview;
  },
  async create(input: CreateInterviewInput): Promise<InterviewSession> {
    const res = await apiClient.post<{ interview: InterviewSession }>('/interviews', input);
    return res.data.interview;
  },
  async open(id: string): Promise<InterviewSession> {
    const res = await apiClient.post<{ interview: InterviewSession }>(`/interviews/${id}/open`);
    return res.data.interview;
  },
  async postTurn(id: string, input: PostTurnInput): Promise<InterviewSession> {
    const res = await apiClient.post<{ interview: InterviewSession }>(
      `/interviews/${id}/turns`,
      input,
    );
    return res.data.interview;
  },
  async end(id: string, input: EndInterviewInput = {}): Promise<InterviewSession> {
    const res = await apiClient.post<{ interview: InterviewSession }>(
      `/interviews/${id}/end`,
      input,
    );
    return res.data.interview;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/interviews/${id}`);
  },
  async voiceQuota(): Promise<VoiceQuota> {
    const res = await apiClient.get<{ quota: VoiceQuota }>('/interviews/voice-quota');
    return res.data.quota;
  },
};

export interface VoiceQuota {
  date: string;
  capSec: number;
  usedSec: number;
  remainingSec: number;
}
