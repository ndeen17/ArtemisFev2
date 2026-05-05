import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { StepHeader } from '@/components/onboarding/StepHeader';
import { Button } from '@/components/ui/Button';
import { SpinnerIcon } from '@/components/ui/icons';
import {
  useCreateCvFromAnswers,
  useGenerateCvFromQuestionnaire,
} from '@/hooks/useOnboarding';
import { extractApiError } from '@/hooks/useAuth';
import { useCvBuilderDraftStore } from '@/store/cvBuilderDraftStore';
import { OnboardingBackButton } from '@/components/onboarding/OnboardingBackButton';

const MIN = 100;
const MAX = 6000;

/**
 * Step 2 of the merged onboarding CV builder. The basics captured on the
 * previous step live in `cvBuilderDraftStore`. Here the user picks one of
 * two explicit paths:
 *
 *   • Use my answers as-is — POST /cv/from-answers (no AI, instant).
 *   • Generate with this JD — POST /cv/from-questionnaire (AI, async).
 *     Requires a JD of at least {@link MIN} chars; we won't ask the AI
 *     to invent a target role.
 *
 * On success we clear the local draft and hand off to the shared editor
 * at /onboarding/cv/edit. The AI path returns 202 immediately and the
 * editor polls onboarding state until the CV is ready.
 */
export default function CvBuilderJdPage() {
  const navigate = useNavigate();
  const generateWithJd = useGenerateCvFromQuestionnaire();
  const createFromAnswers = useCreateCvFromAnswers();
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
  const tooShort = len > 0 && len < MIN;
  const canTailor = len >= MIN && len <= MAX;

  async function useAnswersOnly() {
    if (!answers) return;
    setError(null);
    try {
      await createFromAnswers.mutateAsync({ answers });
      clearDraft();
      navigate('/onboarding/cv/edit');
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  async function generateWithJobDescription() {
    if (!answers || !canTailor) return;
    setError(null);
    try {
      await generateWithJd.mutateAsync({ answers, jobDescription: jd.trim() });
      clearDraft();
      navigate('/onboarding/cv/edit');
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  if (!answers) return null;

  const isPending = generateWithJd.isPending || createFromAnswers.isPending;

  return (
    <OnboardingLayout step={3} backTo="/onboarding/cv/basics">
      <StepHeader
        eyebrow="Step 3 · How should we build it?"
        title="Build from your answers, or tailor to a job?"
        subtitle="Two options. Use what you've entered as a clean starter CV, or paste a job description and we'll tailor the draft for that role."
      />

      <div className="space-y-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
          <h2 className="text-[15px] font-semibold text-[#111827]">
            Option 1 — Use my answers as-is
          </h2>
          <p className="mt-1 text-[13.5px] text-gray-600 leading-relaxed">
            We'll build a clean CV directly from what you entered. No AI involved — fastest path,
            and you can refine everything in the editor on the next step.
          </p>
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              onClick={useAnswersOnly}
              disabled={isPending}
            >
              {createFromAnswers.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <SpinnerIcon /> Building…
                </span>
              ) : (
                'Use my answers as-is'
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 space-y-3">
          <div>
            <h2 className="text-[15px] font-semibold text-[#111827]">
              Option 2 — Tailor to a job description
            </h2>
            <p className="mt-1 text-[13.5px] text-gray-600 leading-relaxed">
              Paste the JD and our AI will rewrite your draft to match the role. A JD of at least{' '}
              {MIN} characters is required so the AI has something concrete to anchor to.
            </p>
          </div>

          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            maxLength={MAX}
            rows={9}
            disabled={isPending}
            placeholder="Paste the job description here…"
            className="w-full resize-none rounded-2xl border border-gray-200 bg-white p-4 text-[15px] leading-relaxed text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-[#dcfce7] disabled:bg-gray-50 disabled:text-gray-500"
          />
          <div className="flex items-center justify-between text-[12px]">
            <span className={tooShort ? 'text-amber-600' : 'text-gray-500'}>
              {len === 0
                ? `Paste at least ${MIN} characters to enable tailoring.`
                : tooShort
                  ? `Add at least ${MIN - len} more characters.`
                  : 'Tip: include responsibilities, requirements, and the seniority level.'}
            </span>
            <span className="text-gray-400">
              {len.toLocaleString()} / {MAX.toLocaleString()}
            </span>
          </div>

          <div>
            <Button
              type="button"
              onClick={generateWithJobDescription}
              disabled={isPending || !canTailor}
            >
              {generateWithJd.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <SpinnerIcon /> Drafting…
                </span>
              ) : (
                'Generate tailored CV'
              )}
            </Button>
          </div>
        </div>
      </div>

      {error ? <div className="text-[13px] text-red-600">{error}</div> : null}

      {generateWithJd.isPending ? (
        <div className="inline-flex items-center gap-2 rounded-2xl border border-brand-green/20 bg-[#ecfdf5] p-4 text-[13px] text-[#065f46]">
          <SpinnerIcon className="animate-spin w-4 h-4" />
          Drafting your CV… this usually takes 20–40 seconds. We'll take you to the editor as
          soon as it's ready.
        </div>
      ) : null}

      {/* Footer row \u2014 the page's primary actions are inside the option
          cards above, so Back sits on its own here, styled to match the
          back buttons on every other onboarding step. */}
      <div className="flex items-center justify-start pt-2">
        <OnboardingBackButton to="/onboarding/cv/basics" disabled={isPending} />
      </div>
    </OnboardingLayout>
  );
}
