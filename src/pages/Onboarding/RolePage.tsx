import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExperienceLevel, Role } from '@artemis/shared';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { StepHeader } from '@/components/onboarding/StepHeader';
import { SelectableCard } from '@/components/onboarding/SelectableCard';
import { Button } from '@/components/ui/Button';
import { ArrowRightIcon, SpinnerIcon } from '@/components/ui/icons';
import { useOnboardingState, usePatchOnboarding } from '@/hooks/useOnboarding';
import { extractApiError } from '@/hooks/useAuth';

const ROLES: { value: Role; title: string; description: string }[] = [
  {
    value: 'software_engineer',
    title: 'Software engineer',
    description: 'Backend, frontend, full-stack, mobile.',
  },
  {
    value: 'product_manager',
    title: 'Product manager',
    description: 'Roadmaps, discovery, shipping outcomes.',
  },
  { value: 'designer', title: 'Designer', description: 'Product, UX, brand, motion.' },
  {
    value: 'data_analyst',
    title: 'Data / analytics',
    description: 'Analyst, scientist, ML engineer.',
  },
  { value: 'marketing', title: 'Marketing', description: 'Growth, content, lifecycle, brand.' },
  { value: 'sales', title: 'Sales', description: 'AE, SDR, partnerships, customer success.' },
  { value: 'operations', title: 'Operations', description: 'Ops, finance, recruiting, programs.' },
  { value: 'other', title: 'Something else', description: 'We support more roles every week.' },
];

const LEVELS: { value: ExperienceLevel; title: string }[] = [
  { value: 'student', title: 'Student / new grad' },
  { value: 'entry', title: '0–2 years' },
  { value: 'mid', title: '3–5 years' },
  { value: 'senior', title: '6–9 years' },
  { value: 'lead', title: 'Staff / lead (10+)' },
];

export default function RolePage() {
  const navigate = useNavigate();
  const stateQuery = useOnboardingState();
  const patch = usePatchOnboarding();
  const [role, setRole] = useState<Role | null>(null);
  const [level, setLevel] = useState<ExperienceLevel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (stateQuery.data) {
      setRole(stateQuery.data.role);
      setLevel(stateQuery.data.experienceLevel);
    }
  }, [stateQuery.data]);

  const canContinue = Boolean(role && level);

  async function next() {
    if (!role || !level) return;
    setError(null);
    try {
      await patch.mutateAsync({ role, experienceLevel: level, onboardingStep: 'goal' });
      navigate('/onboarding/goal');
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  return (
    <OnboardingLayout step={1} backTo="/">
      <StepHeader
        eyebrow="Step 1"
        title="What do you do?"
        subtitle="We tailor your dashboard, prep questions, and CV feedback to your role and seniority."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ROLES.map((r) => (
          <SelectableCard
            key={r.value}
            selected={role === r.value}
            onSelect={() => setRole(r.value)}
            title={r.title}
            description={r.description}
          />
        ))}
      </div>

      <div className="space-y-3">
        <div className="text-[14px] font-semibold text-[#111827]">
          How much experience do you have?
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => setLevel(l.value)}
              aria-pressed={level === l.value}
              className={`rounded-full px-4 py-2.5 text-[13px] font-semibold border transition-colors ${
                level === l.value
                  ? 'bg-brand-green text-[#111827] border-brand-green ring-2 ring-[#dcfce7]'
                  : 'bg-white text-[#111827] border-gray-200 hover:border-gray-300'
              }`}
            >
              {l.title}
            </button>
          ))}
        </div>
      </div>

      {error ? <div className="text-[13px] text-red-600">{error}</div> : null}

      <div className="flex justify-end pt-2">
        <Button onClick={next} disabled={!canContinue || patch.isPending}>
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
