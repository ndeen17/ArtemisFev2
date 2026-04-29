import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { StepHeader } from '@/components/onboarding/StepHeader';
import { Button } from '@/components/ui/Button';
import { ArrowRightIcon, LinkedInIcon, SpinnerIcon } from '@/components/ui/icons';
import { useCompleteOnboarding } from '@/hooks/useOnboarding';
import { extractApiError } from '@/hooks/useAuth';

export default function LinkedInPage() {
  const navigate = useNavigate();
  const complete = useCompleteOnboarding();
  const [error, setError] = useState<string | null>(null);

  async function finish() {
    setError(null);
    try {
      await complete.mutateAsync();
      navigate('/onboarding/complete');
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  return (
    <OnboardingLayout step={4} backTo="/onboarding/cv">
      <StepHeader
        eyebrow="Step 4"
        title="Connect LinkedIn"
        subtitle="Speed up applications and get profile feedback alongside your CV. This integration is rolling out — you can connect later from your profile."
      />

      <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 flex items-start gap-5">
        <span className="shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef5fc]">
          <LinkedInIcon />
        </span>
        <div className="flex-1">
          <div className="text-[16px] font-semibold text-[#111827]">LinkedIn</div>
          <p className="mt-1 text-[14px] text-gray-600 leading-relaxed">
            We&apos;re finalising the LinkedIn integration so we can pull your headline, roles, and
            recommendations into your profile. It will be available shortly.
          </p>
          <div className="mt-4">
            <Button variant="outline" size="sm" disabled>
              Coming soon
            </Button>
          </div>
        </div>
      </div>

      {error ? <div className="text-[13px] text-red-600">{error}</div> : null}

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={finish} disabled={complete.isPending}>
          Skip for now
        </Button>
        <Button onClick={finish} disabled={complete.isPending}>
          {complete.isPending ? (
            <span className="inline-flex items-center gap-2">
              <SpinnerIcon /> Wrapping up…
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              Finish setup <ArrowRightIcon />
            </span>
          )}
        </Button>
      </div>
    </OnboardingLayout>
  );
}
