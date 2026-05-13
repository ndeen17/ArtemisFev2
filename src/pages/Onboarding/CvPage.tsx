import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { OnboardingBackButton } from '@/components/onboarding/OnboardingBackButton';
import { StepHeader } from '@/components/onboarding/StepHeader';
import { CvUploader } from '@/components/onboarding/CvUploader';
import { Button } from '@/components/ui/Button';
import { FileIcon, TrashIcon } from '@/components/ui/icons';
import {
  useMyCv,
  usePatchOnboarding,
  useRemoveCv,
  useUploadCv,
} from '@/hooks/useOnboarding';
import { extractApiError } from '@/hooks/useAuth';
import type { CvDetail } from '@artemis/shared';

export default function CvPage() {
  const navigate = useNavigate();
  const cvQuery = useMyCv();
  const upload = useUploadCv();
  const patch = usePatchOnboarding();
  const remove = useRemoveCv();
  const [error, setError] = useState<string | null>(null);
  const [showReplace, setShowReplace] = useState(false);

  async function handleUpload(file: File) {
    setError(null);
    try {
      await upload.mutateAsync(file);
      // Upload path: the user already has a finished CV. Skip the structured
      // editor (which can feel like a "build a CV" detour after upload) and
      // jump straight to the next onboarding step. They can still tweak it
      // anytime via Profile → Edit CV or Settings → Resume.
      navigate('/onboarding/linkedin');
    } catch (err) {
      const apiErr = extractApiError(err);
      setError(apiErr.message);
    }
  }

  async function handleReplace(file: File) {
    setError(null);
    try {
      await upload.mutateAsync(file);
      setShowReplace(false);
      navigate('/onboarding/linkedin');
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  async function handleRemove() {
    if (!cvQuery.data) return;
    if (
      !window.confirm(
        'Remove this CV? You can upload a new one or build one from scratch afterwards.',
      )
    )
      return;
    setError(null);
    try {
      await remove.mutateAsync(cvQuery.data.id);
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  async function handleContinue() {
    setError(null);
    try {
      // Idempotent PATCH guarantees the BE + auth store have onboardingStep='linkedin'
      // before navigating, so OnboardingGate can't boomerang the user back here
      // when the auth store is stale (returning users, or the post-upload refetch
      // lost a cold-start race).
      await patch.mutateAsync({ onboardingStep: 'linkedin' });
      navigate('/onboarding/linkedin');
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  async function dontHaveOne() {
    setError(null);
    try {
      // Conversational builder — single page with editor + AI chat. Replaces
      // the legacy questionnaire + JD-paste pages.
      await patch.mutateAsync({ onboardingStep: 'cv_builder_questionnaire' });
      navigate('/onboarding/cv/builder');
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  const cv = cvQuery.data ?? null;
  const hasCv = !!cv;

  return (
    <OnboardingLayout step={3} backTo="/onboarding/goal">
      <StepHeader
        eyebrow="Step 3"
        title="Bring your CV in"
        subtitle={
          hasCv
            ? 'You already uploaded a CV. Edit it, replace it, or continue.'
            : 'We use it to personalise feedback and to power your application toolkit. It never leaves your account.'
        }
      />

      {hasCv && !showReplace ? (
        <CvSummaryCard
          cv={cv!}
          onEdit={() => navigate('/onboarding/cv/edit')}
          onReplace={() => setShowReplace(true)}
          onRemove={handleRemove}
          removing={remove.isPending}
        />
      ) : (
        <CvUploader
          onUpload={hasCv ? handleReplace : handleUpload}
          pending={upload.isPending}
          errorMessage={error}
        />
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <OnboardingBackButton to="/onboarding/goal" />
        {hasCv ? (
          showReplace ? (
            <Button variant="ghost" size="sm" onClick={() => setShowReplace(false)}>
              Cancel replace
            </Button>
          ) : (
            <Button onClick={handleContinue} size="sm" disabled={patch.isPending}>
              {patch.isPending ? 'Saving…' : 'Continue'}
            </Button>
          )
        ) : (
          <Button variant="ghost" size="sm" onClick={dontHaveOne} disabled={patch.isPending}>
            I don&apos;t have a CV yet
          </Button>
        )}
      </div>

      {hasCv && error ? <div className="pt-2 text-[13px] text-red-600">{error}</div> : null}
    </OnboardingLayout>
  );
}

function CvSummaryCard({
  cv,
  onEdit,
  onReplace,
  onRemove,
  removing,
}: {
  cv: CvDetail;
  onEdit(): void;
  onReplace(): void;
  onRemove(): void;
  removing: boolean;
}) {
  const fullName = cv.structured?.header.fullName?.trim() || 'Unnamed candidate';
  const headline = cv.structured?.header.headline?.trim() || '';
  const expCount = cv.structured?.experience.length ?? 0;
  const eduCount = cv.structured?.education.length ?? 0;
  const skillCount = cv.structured?.skills.length ?? 0;
  const sourceLabel =
    cv.source === 'upload' ? 'Uploaded' : cv.source === 'jd' ? 'Built from job ad' : 'Built from Q&A';
  const filename = cv.filename ?? `${sourceLabel} CV`;
  const updated = new Date(cv.createdAt);
  const updatedLabel = isNaN(updated.getTime())
    ? ''
    : updated.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-start gap-4">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#ecfdf5] text-brand-green shrink-0">
          <FileIcon />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-semibold text-[#111827] truncate">{filename}</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
              {sourceLabel}
            </span>
            {updatedLabel ? (
              <span className="text-[12px] text-gray-500">Added {updatedLabel}</span>
            ) : null}
          </div>
          <div className="mt-1 text-[13.5px] text-gray-700">
            <span className="font-medium">{fullName}</span>
            {headline ? <span className="text-gray-500"> · {headline}</span> : null}
          </div>
          <div className="mt-0.5 text-[12.5px] text-gray-500">
            {expCount} experience{expCount === 1 ? '' : 's'} · {eduCount} education
            {eduCount === 1 ? '' : 's'} · {skillCount} skill{skillCount === 1 ? '' : 's'}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button onClick={onEdit} size="sm">
          Edit or improve CV
        </Button>
        <Button onClick={onReplace} variant="outline" size="sm">
          Replace
        </Button>
        <Button
          onClick={onRemove}
          variant="ghost"
          size="sm"
          disabled={removing}
          className="text-red-600 hover:text-red-700"
        >
          <span className="inline-flex items-center gap-1.5">
            <TrashIcon />
            {removing ? 'Removing…' : 'Remove'}
          </span>
        </Button>
      </div>
    </div>
  );
}
