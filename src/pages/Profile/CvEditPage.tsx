import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { StructuredCv } from '@artemis/shared';
import { AppShell } from '@/components/layout/AppShell';
import { CvEditor } from '@/components/cv/CvEditor';
import { Button } from '@/components/ui/Button';
import { SpinnerIcon } from '@/components/ui/icons';
import { useMyCv, usePatchCv, useReparseCv } from '@/hooks/useOnboarding';
import { useActionPlan } from '@/hooks/useProfile';
import { extractApiError } from '@/hooks/useAuth';
import { emptyStructuredCv, isStructuredCvSparse } from '@/lib/structuredCv';
import { cvApi } from '@/features/onboarding/api';

/**
 * Profile-side CV editor. Same component as onboarding but lives inside
 * AppShell and returns to /profile on save.
 *
 * Two cross-cutting features wired here:
 *   1. If the loaded CV is `source: 'upload'` and structured is sparse
 *      (silent parse failure), auto-reparse once on first open.
 *   2. `?focus=<actionId>` from the action plan: jump to the relevant section
 *      and open the AI coach pre-loaded with the action's title + detail.
 */
export default function ProfileCvEditPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusActionId = searchParams.get('focus');
  const cvQuery = useMyCv();
  const patch = usePatchCv();
  const reparse = useReparseCv();
  const actionPlan = useActionPlan();
  const [draft, setDraft] = useState<StructuredCv | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reparsedRef = useRef(false);

  // Auto-reparse on first open when an uploaded CV has nothing to show.
  useEffect(() => {
    if (reparsedRef.current) return;
    const cv = cvQuery.data;
    if (!cv) return;
    if (cv.source !== 'upload') return;
    if (!isStructuredCvSparse(cv.structured ?? null)) return;
    reparsedRef.current = true;
    reparse.mutate(cv.id, {
      onSuccess: (next) => {
        // Force-rehydrate the editor with the freshly-parsed shape; otherwise
        // the local `draft` state stays stuck on the empty skeleton it was
        // initialised from.
        setDraft(next.structured ?? emptyStructuredCv());
        setError(null);
      },
      onError: (err) => {
        setError(extractApiError(err).message);
      },
    });
  }, [cvQuery.data, reparse]);

  // Hydrate local draft once we have data.
  useEffect(() => {
    if (cvQuery.data && draft === null) {
      setDraft(cvQuery.data.structured ?? emptyStructuredCv());
    }
  }, [cvQuery.data, draft]);

  // Resolve the focused action so we can pass initialSection + a coach seed.
  const focusedAction = useMemo(() => {
    if (!focusActionId) return null;
    return actionPlan.data?.items.find((i) => i.id === focusActionId) ?? null;
  }, [focusActionId, actionPlan.data]);

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

  const isReparsing = reparse.isPending;

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
          {isReparsing ? (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-green/10 px-3 py-1.5 text-[12.5px] font-semibold text-[#065f46]">
              <SpinnerIcon className="animate-spin w-4 h-4" />
              Auto-filling from your upload…
            </div>
          ) : null}
          {cvQuery.data.source === 'upload' ? (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => {
                  reparsedRef.current = true;
                  reparse.mutate(cvQuery.data!.id, {
                    onSuccess: (next) => {
                      setDraft(next.structured ?? emptyStructuredCv());
                      setError(null);
                    },
                    onError: (err) => setError(extractApiError(err).message),
                  });
                }}
                disabled={isReparsing}
                className="text-[12.5px] font-semibold text-[#15803d] hover:underline disabled:opacity-50"
              >
                ↻ Re-pull from your upload
              </button>
            </div>
          ) : null}
          <CvEditor
            value={draft}
            onChange={setDraft}
            cvId={cvQuery.data.id}
            initialSection={focusedAction?.section}
            seedCoachMessage={
              focusedAction
                ? `Help me address this from my action plan: "${focusedAction.title}". Detail: ${focusedAction.detail}`
                : undefined
            }
          />
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
