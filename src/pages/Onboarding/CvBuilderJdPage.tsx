import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { StepHeader } from '@/components/onboarding/StepHeader';
import { Button } from '@/components/ui/Button';
import { SpinnerIcon } from '@/components/ui/icons';
import { useGenerateCvFromJd } from '@/hooks/useOnboarding';
import { extractApiError } from '@/hooks/useAuth';

const MIN = 100;
const MAX = 6000;

export default function CvBuilderJdPage() {
  const navigate = useNavigate();
  const generate = useGenerateCvFromJd();
  const [jd, setJd] = useState('');
  const [error, setError] = useState<string | null>(null);

  const len = jd.trim().length;
  const tooShort = len < MIN;
  const ready = len >= MIN && len <= MAX;

  async function submit() {
    setError(null);
    if (!ready) {
      setError(
        len === 0
          ? 'Paste a job description to continue.'
          : `Add at least ${MIN - len} more characters for a useful draft.`,
      );
      return;
    }
    try {
      await generate.mutateAsync({ jobDescription: jd.trim() });
      navigate('/onboarding/cv/edit');
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  return (
    <OnboardingLayout step={3} backTo="/onboarding/no-cv">
      <StepHeader
        eyebrow="CV from a job description"
        title="Paste the JD you'd love to land."
        subtitle="We'll draft a starter CV that reflects what the role is asking for. You can refine it later."
      />

      <div className="space-y-2">
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          maxLength={MAX}
          rows={12}
          placeholder="Paste the job description here…"
          className="w-full resize-none rounded-2xl border border-gray-200 bg-white p-4 text-[15px] leading-relaxed text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-[#dcfce7]"
        />
        <div className="flex items-center justify-between text-[12px]">
          <span className={tooShort ? 'text-amber-600' : 'text-gray-500'}>
            {len === 0
              ? `Paste a job description (at least ${MIN} characters) to continue.`
              : tooShort
                ? `Add at least ${MIN - len} more characters for a useful draft.`
                : 'Tip: include responsibilities, requirements, and the seniority level.'}
          </span>
          <span className="text-gray-400">
            {len.toLocaleString()} / {MAX.toLocaleString()}
          </span>
        </div>
      </div>

      {error ? <div className="text-[13px] text-red-600">{error}</div> : null}

      <div className="flex justify-end">
        <Button onClick={submit} disabled={generate.isPending}>
          {generate.isPending ? (
            <span className="inline-flex items-center gap-2">
              <SpinnerIcon /> Drafting your CV…
            </span>
          ) : (
            'Draft my CV'
          )}
        </Button>
      </div>
    </OnboardingLayout>
  );
}
