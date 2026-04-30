import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { StructuredCv } from '@artemis/shared';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { StepHeader } from '@/components/onboarding/StepHeader';
import { CvEditor } from '@/components/cv/CvEditor';
import { Button } from '@/components/ui/Button';
import { SpinnerIcon } from '@/components/ui/icons';
import { useMyCv, usePatchCv, useReparseCv } from '@/hooks/useOnboarding';
import { extractApiError } from '@/hooks/useAuth';
import { emptyStructuredCv, isStructuredCvSparse } from '@/lib/structuredCv';
import { cvApi } from '@/features/onboarding/api';
/**
 * ONB-06C — Interactive editor that runs after a user has drafted (JD or
 * questionnaire) or uploaded a CV. We seed the editor with whatever the
 * backend parsed, the user makes edits with live preview, and on Continue
 * we save and route to the LinkedIn step.
 *
 * If the upload-time AI parse failed silently and the structured shape is
 * empty, auto-reparse once on first open.
 */
export default function CvEditPage() {
  const navigate = useNavigate();
  const cvQuery = useMyCv();
  const patch = usePatchCv();
  const reparse = useReparseCv();
  const [draft, setDraft] = useState<StructuredCv | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reparsedRef = useRef(false);

  useEffect(() => {
    if (reparsedRef.current) return;
    const cv = cvQuery.data;
    if (!cv) return;
    if (cv.source !== 'upload') return;
    if (!isStructuredCvSparse(cv.structured ?? null)) return;
    reparsedRef.current = true;
    reparse.mutate(cv.id, {
      onSuccess: (next) => {
        // Force the editor to pick up the freshly-parsed shape — otherwise the
        // local `draft` state stays stuck on the empty skeleton it was
        // initialised from.
        setDraft(next.structured ?? emptyStructuredCv());
        setError(null);
      },
      onError: (err) => setError(extractApiError(err).message),
    });
  }, [cvQuery.data, reparse]);

  useEffect(() => {
    if (cvQuery.data && draft === null) {
      setDraft(cvQuery.data.structured ?? emptyStructuredCv());
    }
  }, [cvQuery.data, draft]);

  async function continueToNext() {
    setError(null);
    if (!cvQuery.data || !draft) return;
    try {
      await patch.mutateAsync({ cvId: cvQuery.data.id, structured: draft });
      navigate('/onboarding/linkedin');
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  async function downloadPdf() {
    if (!cvQuery.data) return;
    try {
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

  if (cvQuery.isLoading || draft === null) {
    return (
      <OnboardingLayout step={3} backTo="/onboarding/no-cv" wide>
        <div className="flex items-center gap-2 text-gray-500">
          <SpinnerIcon /> Loading your draft…
        </div>
      </OnboardingLayout>
    );
  }
  if (!cvQuery.data) {
    return (
      <OnboardingLayout step={3} backTo="/onboarding/no-cv" wide>
        <p className="text-[14px] text-gray-600">
          We could not find your CV. Go back and try drafting again.
        </p>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout step={3} backTo="/onboarding/no-cv" wide>
      <StepHeader
        eyebrow="Your CV draft"
        title="Refine each section, then continue."
        subtitle="Edits update the live preview on the right. The AI coach is one click away if you get stuck."
      />

      {reparse.isPending ? (
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-green/10 px-3 py-1.5 text-[12.5px] font-semibold text-[#065f46]">
          <SpinnerIcon className="animate-spin w-4 h-4" />
          Auto-filling from your upload…
        </div>
      ) : null}

      <CvEditor value={draft} onChange={setDraft} cvId={cvQuery.data.id} />

      {error ? <div className="text-[13px] text-red-600">{error}</div> : null}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button variant="ghost" onClick={downloadPdf}>
          Download PDF
        </Button>
        <Button onClick={continueToNext} disabled={patch.isPending}>
          {patch.isPending ? (
            <span className="inline-flex items-center gap-2">
              <SpinnerIcon /> Saving…
            </span>
          ) : (
            'Save & continue'
          )}
        </Button>
      </div>
    </OnboardingLayout>
  );
}
