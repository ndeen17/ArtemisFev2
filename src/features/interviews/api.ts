import type {
  CreateInterviewInput,
  EndInterviewInput,
  InterviewSession,
  InterviewSessionSummary,
  PostTurnInput,
  RealtimeSessionRequest,
  RealtimeSessionResponse,
  RealtimeTranscriptBatch,
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
  /** Phase 8G — mint an OpenAI ephemeral key for direct browser↔OpenAI WebRTC. */
  async realtimeSession(
    id: string,
    input: RealtimeSessionRequest = {},
  ): Promise<RealtimeSessionResponse> {
    const res = await apiClient.post<RealtimeSessionResponse>(
      `/interviews/${id}/realtime/session`,
      input,
    );
    return res.data;
  },
  /** Phase 8G — batched persist of finalised transcript turns from WebRTC. */
  async realtimeTranscript(id: string, input: RealtimeTranscriptBatch): Promise<InterviewSession> {
    const res = await apiClient.post<{ interview: InterviewSession }>(
      `/interviews/${id}/realtime/transcript`,
      input,
    );
    return res.data.interview;
  },
};

export interface VoiceQuota {
  date: string;
  capSec: number;
  usedSec: number;
  remainingSec: number;
}

