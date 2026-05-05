import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { StepHeader } from '@/components/onboarding/StepHeader';
import { Button } from '@/components/ui/Button';
import { SpinnerIcon } from '@/components/ui/icons';
import { useGenerateCvFromQuestionnaire } from '@/hooks/useOnboarding';
import { extractApiError } from '@/hooks/useAuth';
import { useCvBuilderDraftStore } from '@/store/cvBuilderDraftStore';

const MIN = 100;
const MAX = 6000;

/**
 * Step 2 of the merged onboarding CV builder. The basics captured on the
 * previous step live in `cvBuilderDraftStore`; here the user can:
 *   • Skip — generate from the answers alone.
 *   • Tailor — paste a JD and have the AI weight the draft towards it.
 *
 * Both paths POST /cv/from-questionnaire (the JD is optional on that
 * endpoint). On success we clear the local draft and hand off to the
 * shared editor at /onboarding/cv/edit.
 */
export default function CvBuilderJdPage() {
  const navigate = useNavigate();
  const generate = useGenerateCvFromQuestionnaire();
  const answers = useCvBuilderDraftStore((s) => s.answers);
  const clearDraft = useCvBuilderDraftStore((s) => s.clear);
  const [jd, setJd] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Defensive redirect: if the user lands here without basics in the store
  // (direct URL hit, cleared storage, etc.) bounce them back to step 1.
  useEffect(() => {
    if (!answers) navigate('/onboarding/cv/basics', { replace: true });
  }, [answers, navigate]);

  const len = jd.trim().length;
  const hasJd = len > 0;
  const tooShort = hasJd && len < MIN;
  const canTailor = len >= MIN && len <= MAX;

  async function generateCv(jobDescription?: string) {
    if (!answers) return;
    setError(null);
    try {
      await generate.mutateAsync({ answers, jobDescription });
      clearDraft();
      navigate('/onboarding/cv/edit');
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  if (!answers) return null;

  const isPending = generate.isPending;

  return (
    <OnboardingLayout step={3} backTo="/onboarding/cv/basics">
      <StepHeader
        eyebrow="Step 3 · Tailor (optional)"
        title="Targeting a specific role?"
        subtitle="Paste the job description and we'll tailor your draft to match it. Totally optional — you can skip and refine later."
      />

      <div className="space-y-2">
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          maxLength={MAX}
          rows={10}
          disabled={isPending}
          placeholder="Paste the job description here…"
          className="w-full resize-none rounded-2xl border border-gray-200 bg-white p-4 text-[15px] leading-relaxed text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-[#dcfce7] disabled:bg-gray-50 disabled:text-gray-500"
        />
        <div className="flex items-center justify-between text-[12px]">
          <span className={tooShort ? 'text-amber-600' : 'text-gray-500'}>
            {!hasJd
              ? `Optional — paste at least ${MIN} characters to tailor, or skip below.`
              : tooShort
                ? `Add at least ${MIN - len} more characters to tailor with this JD.`
                : 'Tip: include responsibilities, requirements, and the seniority level.'}
          </span>
          <span className="text-gray-400">
            {len.toLocaleString()} / {MAX.toLocaleString()}
          </span>
        </div>
      </div>

      {error ? <div className="text-[13px] text-red-600">{error}</div> : null}

      {isPending ? (
        <div className="inline-flex items-center gap-2 rounded-2xl border border-brand-green/20 bg-[#ecfdf5] p-4 text-[13px] text-[#065f46]">
          <SpinnerIcon className="animate-spin w-4 h-4" />
          Drafting your CV… this usually takes 15–30 seconds.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => generateCv()}
          disabled={isPending}
        >
          Skip — build from my answers
        </Button>
        <Button
          type="button"
          onClick={() => generateCv(jd.trim())}
          disabled={isPending || !canTailor}
        >
          Tailor my CV with this JD
        </Button>
      </div>
    </OnboardingLayout>
  );
}
