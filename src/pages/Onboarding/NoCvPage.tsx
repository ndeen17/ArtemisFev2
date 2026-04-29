import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { StepHeader } from '@/components/onboarding/StepHeader';
import { SelectableCard } from '@/components/onboarding/SelectableCard';
import { Button } from '@/components/ui/Button';
import { ArrowRightIcon, SpinnerIcon } from '@/components/ui/icons';
import { usePatchOnboarding } from '@/hooks/useOnboarding';
import { extractApiError } from '@/hooks/useAuth';

type Path = 'cv_builder_jd' | 'cv_builder_questionnaire';

export default function NoCvPage() {
  const navigate = useNavigate();
  const patch = usePatchOnboarding();
  const [pick, setPick] = useState<Path | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function next() {
    if (!pick) return;
    setError(null);
    try {
      await patch.mutateAsync({ onboardingStep: pick });
      navigate(pick === 'cv_builder_jd' ? '/onboarding/cv/jd' : '/onboarding/cv/builder');
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  return (
    <OnboardingLayout step={3} backTo="/onboarding/cv">
      <StepHeader
        eyebrow="No CV yet?"
        title="Let's draft one together."
        subtitle="Pick the path that feels easier — both produce a clean starter CV in under a minute."
      />

      <div className="grid grid-cols-1 gap-3">
        <SelectableCard
          selected={pick === 'cv_builder_jd'}
          onSelect={() => setPick('cv_builder_jd')}
          title="Start from a job description"
          description="Paste a JD you'd love to apply for and we'll reverse-engineer a CV around it."
        />
        <SelectableCard
          selected={pick === 'cv_builder_questionnaire'}
          onSelect={() => setPick('cv_builder_questionnaire')}
          title="Answer a few questions"
          description="A short, structured form. Best when you're not targeting a specific role yet."
        />
      </div>

      {error ? <div className="text-[13px] text-red-600">{error}</div> : null}

      <div className="flex justify-end">
        <Button onClick={next} disabled={!pick || patch.isPending}>
          {patch.isPending ? (
            <span className="inline-flex items-center gap-2">
              <SpinnerIcon /> Saving…
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              Continue <ArrowRightIcon />
            </span>
          )}
        </Button>
      </div>
    </OnboardingLayout>
  );
}
