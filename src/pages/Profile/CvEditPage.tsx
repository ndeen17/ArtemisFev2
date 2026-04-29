import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { StructuredCv } from '@artemis/shared';
import { AppShell } from '@/components/layout/AppShell';
import { CvEditor } from '@/components/cv/CvEditor';
import { Button } from '@/components/ui/Button';
import { SpinnerIcon } from '@/components/ui/icons';
import { useMyCv, usePatchCv } from '@/hooks/useOnboarding';
import { extractApiError } from '@/hooks/useAuth';
import { emptyStructuredCv } from '@/lib/structuredCv';
import { cvApi } from '@/features/onboarding/api';

/**
 * Profile-side CV editor. Same component as onboarding but lives inside
 * AppShell and returns to /profile on save.
 */
export default function ProfileCvEditPage() {
  const navigate = useNavigate();
  const cvQuery = useMyCv();
  const patch = usePatchCv();
  const [draft, setDraft] = useState<StructuredCv | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cvQuery.data && draft === null) {
      setDraft(cvQuery.data.structured ?? emptyStructuredCv());
    }
  }, [cvQuery.data, draft]);

  async function save() {
    setError(null);
    if (!cvQuery.data || !draft) return;
    try {
      await patch.mutateAsync({ cvId: cvQuery.data.id, structured: draft });
      navigate('/profile');
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  async function downloadPdf() {
    if (!cvQuery.data) return;
    try {
      const data = await cvApi.downloadPdf(cvQuery.data.id);
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cv.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  return (
    <AppShell title="Edit your CV" subtitle="Tweak any section, preview live, then save.">
      {cvQuery.isLoading || draft === null ? (
        <div className="flex items-center gap-2 text-gray-500">
          <SpinnerIcon /> Loading your CV…
        </div>
      ) : !cvQuery.data ? (
        <p className="text-[14px] text-gray-600">
          You don&apos;t have a CV yet. Add one from your profile to get started.
        </p>
      ) : (
        <>
          <CvEditor value={draft} onChange={setDraft} />
          {error ? <div className="mt-3 text-[13px] text-red-600">{error}</div> : null}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" onClick={downloadPdf}>
              Download PDF
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => navigate('/profile')}>
                Cancel
              </Button>
              <Button onClick={save} disabled={patch.isPending}>
                {patch.isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <SpinnerIcon /> Saving…
                  </span>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
