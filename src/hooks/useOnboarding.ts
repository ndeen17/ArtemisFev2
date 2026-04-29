import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { OnboardingState } from '@artemis/shared';
import { onboardingApi, cvApi } from '@/features/onboarding/api';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useAuthStore } from '@/store/authStore';

const KEY = ['onboarding', 'state'] as const;
const CV_KEY = ['cv', 'me'] as const;

/** Pulls current onboarding state from the server and mirrors it into the store. */
export function useOnboardingState() {
  const hydrate = useOnboardingStore((s) => s.hydrate);
  const query = useQuery({
    queryKey: KEY,
    queryFn: onboardingApi.getState,
    staleTime: 30_000,
  });
  useEffect(() => {
    if (query.data) hydrate(query.data);
  }, [query.data, hydrate]);
  return query;
}

function syncAuthStep(qc: ReturnType<typeof useQueryClient>, state: OnboardingState) {
  // Keep the auth store in lockstep so refreshes / Navbar reflect the latest step.
  const auth = useAuthStore.getState();
  if (auth.user) {
    auth.setUser({
      ...auth.user,
      onboardingStep: state.onboardingStep,
      onboardingComplete: state.onboardingComplete,
    });
  }
  qc.setQueryData(KEY, state);
}

export function usePatchOnboarding() {
  const qc = useQueryClient();
  const hydrate = useOnboardingStore((s) => s.hydrate);
  return useMutation({
    mutationFn: onboardingApi.patch,
    onSuccess(state) {
      hydrate(state);
      syncAuthStep(qc, state);
    },
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  const hydrate = useOnboardingStore((s) => s.hydrate);
  return useMutation({
    mutationFn: onboardingApi.complete,
    onSuccess(state) {
      hydrate(state);
      syncAuthStep(qc, state);
    },
  });
}

export function useMyCv() {
  return useQuery({ queryKey: CV_KEY, queryFn: cvApi.me, staleTime: 30_000 });
}

export function useUploadCv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cvApi.upload,
    onSuccess() {
      void qc.invalidateQueries({ queryKey: CV_KEY });
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useGenerateCvFromJd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cvApi.fromJd,
    onSuccess() {
      void qc.invalidateQueries({ queryKey: CV_KEY });
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useGenerateCvFromQuestionnaire() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cvApi.fromQuestionnaire,
    onSuccess() {
      void qc.invalidateQueries({ queryKey: CV_KEY });
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
