import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { StructuredCv } from '@artemis/shared';
import { AppShell } from '@/components/layout/AppShell';
import { CvEditor } from '@/components/cv/CvEditor';
import { Button } from '@/components/ui/Button';
import { SpinnerIcon } from '@/components/ui/icons';
import {
  useApplication,
  usePatchTargetedCv,
  useReparseTargetedCv,
} from '@/hooks/useApplications';
import { applicationApi } from '@/features/applications/api';
import { extractApiError } from '@/hooks/useAuth';
import { emptyStructuredCv, isStructuredCvSparse } from '@/lib/structuredCv';

/**
 * APP-04 — edit a targeted CV. Mirrors `Profile/CvEditPage` but operates on
 * `Application.targetedCv.structured` instead of the canonical CV.
 *
 * The bullet-rewrite drawer is intentionally hidden here (no `cvId` is
 * threaded into `<CvEditor>`) — the rewrite endpoints are scoped to the
 * canonical CV, not to a targeted snapshot.
 */
export default function TargetedCvEditPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const appQuery = useApplication(id);
  const patch = usePatchTargetedCv(id);
  const reparse = useReparseTargetedCv(id);

  const [draft, setDraft] = useState<StructuredCv | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reparsedRef = useRef(false);

  const targeted = appQuery.data?.targetedCv ?? null;

  // Auto-reparse on first open when the editor would otherwise be empty —
  // covers legacy targeted CVs created before structured was persisted, and
  // the rare case where the AI text→JSON step returned an empty skeleton.
  useEffect(() => {
    if (reparsedRef.current) return;
    if (!targeted) return;
    if (!isStructuredCvSparse(targeted.structured ?? null)) return;
    reparsedRef.current = true;
    reparse.mutate(undefined, {
      onSuccess: (next) => {
        setDraft(next.targetedCv?.structured ?? emptyStructuredCv());
        setError(null);
      },
      onError: (err) => setError(extractApiError(err).message),
    });
  }, [targeted, reparse]);

  // Hydrate local draft once we have data.
  useEffect(() => {
    if (targeted && draft === null) {
      setDraft(targeted.structured ?? emptyStructuredCv());
    }
  }, [targeted, draft]);

  async function save() {
    setError(null);
    if (!draft) return;
    try {
      await patch.mutateAsync({ structured: draft });
      navigate(`/applications/${id}/cv-review`);
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  async function downloadPdf() {
    setError(null);
    try {
      // Persist the latest draft first so the PDF reflects what's on screen.
      if (draft) {
        await patch.mutateAsync({ structured: draft });
      }
      const blob = await applicationApi.downloadTargetedCvPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName =
        targeted?.name ||
        `${appQuery.data?.jobTitle ?? 'targeted'}-${appQuery.data?.company ?? 'cv'}`;
      const slug =
        baseName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 80) || 'targeted-cv';
      a.download = `${slug}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  const isReparsing = reparse.isPending;

  return (
    <AppShell
      title="Edit targeted CV"
      subtitle={appQuery.data ? `${appQuery.data.jobTitle} · ${appQuery.data.company}` : undefined}
    >
      {appQuery.isLoading || draft === null ? (
        <div className="flex items-center gap-2 text-gray-500">
          <SpinnerIcon /> Loading targeted CV…
        </div>
      ) : !targeted ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center">
          <h2 className="text-[18px] font-semibold text-[#111827]">Not tailored yet</h2>
          <p className="mt-1 text-[13px] text-gray-500">
            Tailor a CV from the review page before editing it.
          </p>
          <div className="mt-4">
            <Button onClick={() => navigate(`/applications/${id}/cv-review`)}>
              Go to review
            </Button>
          </div>
        </div>
      ) : (
        <>
          {isReparsing ? (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-green/10 px-3 py-1.5 text-[12.5px] font-semibold text-[#065f46]">
              <SpinnerIcon className="animate-spin w-4 h-4" />
              Auto-filling from the tailored text…
            </div>
          ) : null}
          <CvEditor value={draft} onChange={setDraft} />
          {error ? <div className="mt-3 text-[13px] text-red-600">{error}</div> : null}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" onClick={downloadPdf}>
              Download PDF
            </Button>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => navigate(`/applications/${id}/cv-review`)}
              >
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
