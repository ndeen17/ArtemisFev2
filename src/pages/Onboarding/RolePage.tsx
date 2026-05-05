import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ExperienceLevel, Role } from '@artemis/shared';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { StepHeader } from '@/components/onboarding/StepHeader';
import { SelectableCard } from '@/components/onboarding/SelectableCard';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { ArrowRightIcon, SpinnerIcon } from '@/components/ui/icons';
import { useOnboardingState, usePatchOnboarding } from '@/hooks/useOnboarding';
import { useAuthStore } from '@/store/authStore';
import { extractApiError } from '@/hooks/useAuth';

const ROLES: { value: Role; title: string; description: string }[] = [
  {
    value: 'software_engineer',
    title: 'Software Engineer',
    description: 'Backend, frontend, full-stack, mobile',
  },
  {
    value: 'product_manager',
    title: 'Product Manager',
    description: 'Product Owner, Delivery manager.',
  },
  { value: 'designer', title: 'Digital Designer', description: 'Product, UX, Brand, Motion' },
  {
    value: 'data_analyst',
    title: 'Data Analyst',
    description: 'Analytics, BI, dashboards, SQL',
  },
];

const LEVELS: { value: ExperienceLevel; title: string }[] = [
  { value: 'student', title: 'Student/New grad' },
  { value: 'entry', title: '0-2 years' },
  { value: 'mid', title: '3-5 years' },
  { value: 'senior', title: '6-9 years' },
  { value: 'lead', title: 'Staff/lead 10+ years' },
];

type Stage = 'name' | 'role';

/**
 * /onboarding/role — split into two micro-steps so the page never feels stuck.
 *
 *  Stage 1 ("name"): just the display name. Submit ⇒ patches displayName +
 *      auth store, advances to stage 2 inline (no route change).
 *  Stage 2 ("role"): role + experience level + Continue → patches both and
 *      navigates to /onboarding/goal.
 *
 * The user sees a single Continue button per stage with clear, immediate
 * feedback — fixing the previous "after typing my name nothing happens"
 * cul-de-sac where Continue was silently disabled until role+level were set.
 */
export default function RolePage() {
  const navigate = useNavigate();
  const stateQuery = useOnboardingState();
  const patch = usePatchOnboarding();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  // Initialise stage synchronously from the persisted auth user — avoids the
  // "name → role" flicker when an already-named user revisits this page after
  // the onboardingState query refetches. We only fall back to 'name' when we
  // have no record of a display name anywhere (auth user OR persisted name).
  const [stage, setStage] = useState<Stage>(() =>
    useAuthStore.getState().user?.displayName ? 'role' : 'name',
  );
  const [displayName, setDisplayName] = useState(
    () => useAuthStore.getState().user?.displayName ?? '',
  );
  const [role, setRole] = useState<Role | null>(null);
  const [level, setLevel] = useState<ExperienceLevel | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hydrate from server state once, and skip the name stage if it's already set.
  useEffect(() => {
    if (!stateQuery.data) return;
    if (stateQuery.data.displayName) {
      setDisplayName((prev) => (prev === '' ? stateQuery.data!.displayName ?? '' : prev));
    }
    setRole((prev) => prev ?? stateQuery.data.role);
    setLevel((prev) => prev ?? stateQuery.data.experienceLevel);
    // Only flip forwards — never regress a user who already advanced to 'role'.
    setStage((prev) => (prev === 'name' && stateQuery.data!.displayName ? 'role' : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateQuery.data]);

  const trimmedName = displayName.trim();
  const canSubmitName = trimmedName.length >= 2;
  const canSubmitRole = Boolean(role && level);

  async function submitName(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSubmitName) return;
    setError(null);
    try {
      await patch.mutateAsync({ displayName: trimmedName });
      if (user) setUser({ ...user, displayName: trimmedName });
      setStage('role');
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  async function submitRole() {
    if (!role || !level) return;
    setError(null);
    try {
      await patch.mutateAsync({
        role,
        experienceLevel: level,
        onboardingStep: 'goal',
      });
      navigate('/onboarding/goal');
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  if (stage === 'name') {
    return (
      <OnboardingLayout step={1} backTo="/">
        <StepHeader
          eyebrow="Welcome"
          title="What should we call you?"
          subtitle="We'll use this to greet you across the app. Just a first name is fine."
        />

        <form onSubmit={submitName} className="space-y-6" noValidate>
          <FormField
            id="onb-name"
            label="Your name"
            placeholder="Jane"
            autoComplete="given-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoFocus
            hint="Two characters or more."
          />

          {error ? <div className="text-[13px] text-red-600">{error}</div> : null}

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={!canSubmitName || patch.isPending}>
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
        </form>
      </OnboardingLayout>
    );
  }

  const greetName = (trimmedName || user?.displayName || '').split(' ')[0];

  return (
    <OnboardingLayout step={1}>
      <StepHeader
        eyebrow={greetName ? `Hey ${greetName}!` : 'Hey there!'}
        title="What do you do?"
        subtitle="We want to personalize your Artemis experience to your role and level of seniority"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
        <div className="text-[14px] text-gray-600">How much experience have you got?</div>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => setLevel(l.value)}
              aria-pressed={level === l.value}
              className={`rounded-full px-4 py-2 text-[13px] font-semibold border transition-colors bg-white text-[#111827] ${
                level === l.value
                  ? 'border-brand-green ring-2 ring-[#dcfce7]'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {l.title}
            </button>
          ))}
        </div>
      </div>

      {error ? <div className="text-[13px] text-red-600">{error}</div> : null}

      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          variant="outline"
          size="md"
          onClick={() => {
            if (stateQuery.data?.displayName) {
              navigate('/');
            } else {
              setStage('name');
            }
          }}
        >
          Back
        </Button>
        <Button size="md" onClick={submitRole} disabled={!canSubmitRole || patch.isPending}>
          {patch.isPending ? (
            <span className="inline-flex items-center gap-2">
              <SpinnerIcon /> Saving…
            </span>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </OnboardingLayout>
  );
}
