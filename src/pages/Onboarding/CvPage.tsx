import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { StepHeader } from '@/components/onboarding/StepHeader';
import { CvUploader } from '@/components/onboarding/CvUploader';
import { Button } from '@/components/ui/Button';
import { useOnboardingState, usePatchOnboarding, useUploadCv } from '@/hooks/useOnboarding';
import { extractApiError } from '@/hooks/useAuth';

export default function CvPage() {
  const navigate = useNavigate();
  const stateQuery = useOnboardingState();
  const upload = useUploadCv();
  const patch = usePatchOnboarding();
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setError(null);
    try {
      await upload.mutateAsync(file);
      navigate('/onboarding/linkedin');
    } catch (err) {
      const apiErr = extractApiError(err);
      setError(apiErr.message);
    }
  }

  async function dontHaveOne() {
    setError(null);
    try {
      await patch.mutateAsync({ onboardingStep: 'no_cv' });
      navigate('/onboarding/no-cv');
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  return (
    <OnboardingLayout step={3} backTo="/onboarding/goal">
      <StepHeader
        eyebrow="Step 3"
        title="Bring your CV in"
        subtitle={
          stateQuery.data?.hasCv
            ? 'You already uploaded a CV — upload a new one to replace it, or continue.'
            : 'We use it to personalise feedback and to power your application toolkit. It never leaves your account.'
        }
      />

      <CvUploader onUpload={handleUpload} pending={upload.isPending} errorMessage={error} />

      <div className="flex items-center justify-between gap-3 pt-2">
        <Button variant="ghost" size="sm" onClick={dontHaveOne} disabled={patch.isPending}>
          I don&apos;t have a CV yet
        </Button>
        {stateQuery.data?.hasCv ? (
          <Button onClick={() => navigate('/onboarding/linkedin')} size="sm">
            Continue with current CV
          </Button>
        ) : null}
      </div>
    </OnboardingLayout>
  );
}
