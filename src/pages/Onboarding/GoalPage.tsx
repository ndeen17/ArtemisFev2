import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Goal } from '@artemis/shared';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { StepHeader } from '@/components/onboarding/StepHeader';
import { SelectableCard } from '@/components/onboarding/SelectableCard';
import { Button } from '@/components/ui/Button';
import { ArrowRightIcon, SpinnerIcon } from '@/components/ui/icons';
import { useOnboardingState, usePatchOnboarding } from '@/hooks/useOnboarding';
import { extractApiError } from '@/hooks/useAuth';

const GOALS: { value: Goal; title: string; description: string }[] = [
  {
    value: 'job_searching',
    title: 'Actively job searching',
    description: 'I want to land a new role in the next few months.',
  },
  {
    value: 'levelling_up',
    title: 'Levelling up where I am',
    description: 'Sharpen interview skills, polish my CV, prep for promotion.',
  },
  {
    value: 'exploring',
    title: 'Just exploring',
    description: 'Curious about what is out there — no rush.',
  },
];

export default function GoalPage() {
  const navigate = useNavigate();
  const stateQuery = useOnboardingState();
  const patch = usePatchOnboarding();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (stateQuery.data) setGoal(stateQuery.data.goal);
  }, [stateQuery.data]);

  async function next() {
    if (!goal) return;
    setError(null);
    try {
      await patch.mutateAsync({ goal, onboardingStep: 'cv' });
      navigate('/onboarding/cv');
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  return (
    <OnboardingLayout step={2} backTo="/onboarding/role">
      <StepHeader
        eyebrow="Step 2"
        title="What brings you to Artemis?"
        subtitle="This shapes the prompts, prep, and progress signals you see throughout the app."
      />

      <div className="grid grid-cols-1 gap-3">
        {GOALS.map((g) => (
          <SelectableCard
            key={g.value}
            selected={goal === g.value}
            onSelect={() => setGoal(g.value)}
            title={g.title}
            description={g.description}
          />
        ))}
      </div>

      {error ? <div className="text-[13px] text-red-600">{error}</div> : null}

      <div className="flex justify-end">
        <Button onClick={next} disabled={!goal || patch.isPending}>
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
