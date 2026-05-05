import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BuilderAction, StructuredCv } from '@artemis/shared';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { OnboardingBackButton } from '@/components/onboarding/OnboardingBackButton';
import { StepHeader } from '@/components/onboarding/StepHeader';
import { CvEditor } from '@/components/cv/CvEditor';
import { CvBuilderChat } from '@/components/cv/CvBuilderChat';
import { Button } from '@/components/ui/Button';
import { SpinnerIcon } from '@/components/ui/icons';
import {
  useCreateBlankCv,
  useMyCv,
  useOnboardingState,
  usePatchCv,
  usePatchOnboarding,
} from '@/hooks/useOnboarding';
import { extractApiError } from '@/hooks/useAuth';
import { emptyStructuredCv } from '@/lib/structuredCv';
import { applyBuilderAction } from '@/lib/cv/applyBuilderAction';
import { cvApi } from '@/features/onboarding/api';

/**
 * CV Builder — onboarding "I don't have a CV" replacement.
 *
 * Replaces the previous questionnaire + JD-paste flow. The user lands here
 * straight from CvPage. We auto-create a blank CV (idempotent) on entry,
 * seeded with their displayName, then show the live `CvEditor` alongside a
 * persistent AI chatbot. The bot returns structured `actions[]` the user
 * applies one-by-one — never auto-applied, never fabricated.
 *
 * Save is debounced — the editor mutates `draft` locally and we PATCH the
 * canonical CV ~600ms after the last edit (or immediately on Continue).
 */
const SAVE_DEBOUNCE_MS = 600;

export default function CvBuilderPage() {
  const navigate = useNavigate();
  const cvQuery = useMyCv();
  const onboarding = useOnboardingState();
  const createBlank = useCreateBlankCv();
  const patch = usePatchCv();
  const patchOnboarding = usePatchOnboarding();

  const [draft, setDraft] = useState<StructuredCv | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const ensuredRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedJsonRef = useRef<string | null>(null);

  // Ensure a CV exists. Idempotent on the server — if the user already has
  // one we just receive it back. Runs once on first mount per page-load.
  useEffect(() => {
    if (ensuredRef.current) return;
    if (cvQuery.isLoading) return;
    ensuredRef.current = true;
    if (cvQuery.data) return;
    const fullName = onboarding.data?.displayName ?? '';
    createBlank.mutate(
      { fullName },
      {
        onError: (err) => setError(extractApiError(err).message),
      },
    );
  }, [cvQuery.isLoading, cvQuery.data, onboarding.data, createBlank]);

  // Seed local draft from server CV on first arrival.
  useEffect(() => {
    if (cvQuery.data && draft === null) {
      const seeded = cvQuery.data.structured ?? emptyStructuredCv();
      setDraft(seeded);
      lastSavedJsonRef.current = JSON.stringify(seeded);
    }
  }, [cvQuery.data, draft]);

  // Debounced autosave on draft changes.
  useEffect(() => {
    if (!draft || !cvQuery.data) return;
    const json = JSON.stringify(draft);
    if (json === lastSavedJsonRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      patch.mutate(
        { cvId: cvQuery.data!.id, structured: draft },
        {
          onSuccess: () => {
            lastSavedJsonRef.current = json;
            setSavedAt(Date.now());
          },
          onError: (err) => setError(extractApiError(err).message),
        },
      );
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [draft, cvQuery.data, patch]);

  function handleApplyAction(action: BuilderAction) {
    setDraft((prev) => (prev ? applyBuilderAction(prev, action) : prev));
  }

  async function flushAndNavigate(target: string) {
    setError(null);
    if (!cvQuery.data || !draft) {
      navigate(target);
      return;
    }
    const json = JSON.stringify(draft);
    try {
      if (json !== lastSavedJsonRef.current) {
        await patch.mutateAsync({ cvId: cvQuery.data.id, structured: draft });
        lastSavedJsonRef.current = json;
      }
      await patchOnboarding.mutateAsync({ onboardingStep: 'linkedin' });
      navigate(target);
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  async function continueLater() {
    // Same destination as Continue — both leave the builder for the next
    // onboarding step. The label is friendlier for users who want to come
    // back and finish the CV from their dashboard.
    try {
      localStorage.setItem('artemis:cvDraftPending', '1');
    } catch {
      /* storage disabled — non-fatal */
    }
    await flushAndNavigate('/onboarding/linkedin');
  }

  async function continueNow() {
    await flushAndNavigate('/onboarding/linkedin');
  }

  async function downloadPdf() {
    if (!cvQuery.data) return;
    try {
      // Make sure unsaved edits are persisted before we render the PDF.
      if (draft && JSON.stringify(draft) !== lastSavedJsonRef.current) {
        await patch.mutateAsync({ cvId: cvQuery.data.id, structured: draft });
        lastSavedJsonRef.current = JSON.stringify(draft);
      }
      const data = await cvApi.downloadPdf(cvQuery.data.id);
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cv.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  const isBootstrapping =
    cvQuery.isLoading || createBlank.isPending || (cvQuery.data && draft === null);

  if (isBootstrapping) {
    return (
      <OnboardingLayout step={3} wide>
        <div className="flex items-center gap-2 text-gray-500">
          <SpinnerIcon /> Setting up your CV builder…
        </div>
        <div className="pt-2">
          <OnboardingBackButton to="/onboarding/cv" />
        </div>
      </OnboardingLayout>
    );
  }

  if (!cvQuery.data || !draft) {
    return (
      <OnboardingLayout step={3} wide>
        <p className="text-[14px] text-gray-600">
          We couldn't open the CV builder. Please go back and try again.
        </p>
        {error ? <div className="text-[13px] text-red-600 pt-2">{error}</div> : null}
        <div className="pt-2">
          <OnboardingBackButton to="/onboarding/cv" />
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout step={3} wide>
      <StepHeader
        eyebrow="Your CV"
        title="Build your CV with the assistant."
        subtitle="Edit any section directly, or chat with the assistant on the right — it'll suggest content as actions you can apply with one click. Nothing is fabricated; the assistant only uses what you tell it."
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-5">
        <div className="min-w-0">
          <CvEditor
            value={draft}
            onChange={setDraft}
            cvId={cvQuery.data.id}
          />
        </div>
        <div className="xl:sticky xl:top-4 xl:self-start xl:h-[calc(100vh-2rem)] h-[560px]">
          <CvBuilderChat
            cv={draft}
            onApplyAction={handleApplyAction}
            storageKey={`artemis:builderChat:${cvQuery.data.id}`}
            className="h-full"
          />
        </div>
      </div>

      {error ? <div className="text-[13px] text-red-600">{error}</div> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <OnboardingBackButton to="/onboarding/cv" disabled={patch.isPending} />
          <Button variant="ghost" onClick={downloadPdf}>
            Download PDF
          </Button>
          <span className="text-[12px] text-gray-500">
            {patch.isPending
              ? 'Saving…'
              : savedAt
                ? 'Saved'
                : ''}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            onClick={continueLater}
            disabled={patch.isPending || patchOnboarding.isPending}
          >
            Continue later
          </Button>
          <Button
            onClick={continueNow}
            disabled={patch.isPending || patchOnboarding.isPending}
          >
            {patchOnboarding.isPending ? (
              <span className="inline-flex items-center gap-2">
                <SpinnerIcon /> Continuing…
              </span>
            ) : (
              'Save & continue'
            )}
          </Button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
