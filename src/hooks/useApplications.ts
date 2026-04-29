import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Application,
  ApplicationStatus,
  ApplicationSummary,
  CreateApplicationInput,
  DraftCoverLetterInput,
  UpdateApplicationInput,
} from '@artemis/shared';
import { applicationApi } from '@/features/applications/api';

const LIST_KEY = (status?: ApplicationStatus) =>
  ['applications', { status: status ?? null }] as const;
const DETAIL_KEY = (id: string) => ['application', id] as const;

export function useApplications(status?: ApplicationStatus) {
  return useQuery({
    queryKey: LIST_KEY(status),
    queryFn: () => applicationApi.list(status),
    staleTime: 30_000,
  });
}

export function useApplication(id: string | undefined) {
  return useQuery({
    queryKey: id ? DETAIL_KEY(id) : ['application', 'noop'],
    queryFn: () => applicationApi.get(id as string),
    enabled: !!id,
    staleTime: 30_000,
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['applications'] });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateApplicationInput) => applicationApi.create(input),
    onSuccess(app: Application) {
      qc.setQueryData(DETAIL_KEY(app.id), app);
      invalidateAll(qc);
    },
  });
}

export function useUpdateApplication(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: UpdateApplicationInput) => applicationApi.update(id, patch),
    onSuccess(app: Application) {
      qc.setQueryData(DETAIL_KEY(app.id), app);
      invalidateAll(qc);
    },
  });
}

export function useSetApplicationStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: ApplicationStatus) => applicationApi.setStatus(id, status),
    onSuccess(app: Application) {
      qc.setQueryData(DETAIL_KEY(app.id), app);
      invalidateAll(qc);
    },
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => applicationApi.remove(id),
    onSuccess() {
      invalidateAll(qc);
    },
  });
}

export function useTargetCv(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => applicationApi.targetCv(id),
    onSuccess(app: Application) {
      qc.setQueryData(DETAIL_KEY(app.id), app);
      invalidateAll(qc);
    },
  });
}

export function useDraftCoverLetter(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DraftCoverLetterInput) => applicationApi.draftCoverLetter(id, input),
    onSuccess(app: Application) {
      qc.setQueryData(DETAIL_KEY(app.id), app);
      invalidateAll(qc);
    },
  });
}

export function useEditCoverLetter(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: { text: string; hook?: string }) =>
      applicationApi.editCoverLetter(id, patch),
    onSuccess(app: Application) {
      qc.setQueryData(DETAIL_KEY(app.id), app);
      invalidateAll(qc);
    },
  });
}

export type { Application, ApplicationSummary, ApplicationStatus };
