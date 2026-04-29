import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateInterviewInput,
  EndInterviewInput,
  InterviewSession,
  PostTurnInput,
} from '@artemis/shared';
import { interviewApi } from '@/features/interviews/api';

const LIST_KEY = ['interviews'] as const;
const DETAIL_KEY = (id: string) => ['interview', id] as const;

export function useInterviews() {
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: () => interviewApi.list(),
    staleTime: 30_000,
  });
}

export function useInterview(id: string | undefined) {
  return useQuery({
    queryKey: id ? DETAIL_KEY(id) : ['interview', 'noop'],
    queryFn: () => interviewApi.get(id as string),
    enabled: !!id,
    staleTime: 5_000,
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: LIST_KEY });
}

export function useCreateInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInterviewInput) => interviewApi.create(input),
    onSuccess(s: InterviewSession) {
      qc.setQueryData(DETAIL_KEY(s.id), s);
      invalidateAll(qc);
    },
  });
}

export function useOpenInterview(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => interviewApi.open(id),
    onSuccess(s: InterviewSession) {
      qc.setQueryData(DETAIL_KEY(s.id), s);
      invalidateAll(qc);
    },
  });
}

export function usePostTurn(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PostTurnInput) => interviewApi.postTurn(id, input),
    onSuccess(s: InterviewSession) {
      qc.setQueryData(DETAIL_KEY(s.id), s);
    },
  });
}

export function useEndInterview(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EndInterviewInput = {}) => interviewApi.end(id, input),
    onSuccess(s: InterviewSession) {
      qc.setQueryData(DETAIL_KEY(s.id), s);
      invalidateAll(qc);
    },
  });
}

export function useDeleteInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => interviewApi.remove(id),
    onSuccess() {
      invalidateAll(qc);
    },
  });
}

export function useVoiceQuota() {
  return useQuery({
    queryKey: ['interviews', 'voiceQuota'] as const,
    queryFn: () => interviewApi.voiceQuota(),
    staleTime: 30_000,
  });
}
