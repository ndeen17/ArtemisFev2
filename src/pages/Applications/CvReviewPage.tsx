import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { SplitPaneShell } from '@/components/layout/SplitPaneShell';
import { BuilderPanel } from '@/components/cv/BuilderPanel';
import { Button } from '@/components/ui/Button';
import { ArrowLeftIcon, SparklesIcon } from '@/components/ui/icons';
import { CvDiffViewer } from '@/components/applications/CvDiffViewer';
import { CvPreview } from '@/components/cv/CvPreview';
import { RefineChatDrawer } from '@/components/applications/RefineChatDrawer';
import { AtsScoreCard } from '@/components/applications/AtsScoreCard';
import {
  useApplication,
  usePatchTargetedCv,
  useReparseTargetedCv,
  useTargetCv,
} from '@/hooks/useApplications';
import { applicationApi } from '@/features/applications/api';
import { extractApiError } from '@/hooks/useAuth';
import { isStructuredCvSparse } from '@/lib/structuredCv';
import { useBuilderUrlState } from '@/hooks/useBuilderUrlState';

/**
 * APP-03 — Targeted CV review. Triggers /applications/:id/target-cv and renders
 * the diff returned by the backend. Also exposes:
 *   - Inline name field (debounced PATCH so the user can rename the resume).
 *   - Download PDF (uses the same branded template as the base CV).
 *   - Edit this resume → opens the inline builder pane (?builder=1).
 */
export default function CvReviewPage() {
  const { id = '' } = useParams<{ id: string }>();
  const query = useApplication(id);
  const target = useTargetCv(id);
  const patchName = usePatchTargetedCv(id);
  const reparse = useReparseTargetedCv(id);
  const app = query.data;
  const targeted = app?.targetedCv ?? null;

  const [name, setName] = useState<string>('');
  const lastSavedNameRef = useRef<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [refineOpen, setRefineOpen] = useState(false);
  const reparsedRef = useRef(false);
  const builder = useBuilderUrlState();

  // Auto-reparse on first open if the targeted CV has no structured payload
  // (legacy targets created before structured was persisted, or AI returned
  // a sparse skeleton). This lets us show the same styled preview the editor
  // and PDF use, instead of the raw monospaced text fallback.
  useEffect(() => {
    if (reparsedRef.current) return;
    if (!targeted) return;
    if (!isStructuredCvSparse(targeted.structured ?? null)) return;
    reparsedRef.current = true;
    reparse.mutate();
  }, [targeted, reparse]);

  // Hydrate the local name input on first load only — subsequent server
  // round-trips (e.g. our own debounced patch landing) shouldn't blow away
  // the user's in-progress typing.
  useEffect(() => {
    if (!targeted) return;
    if (lastSavedNameRef.current !== null) return;
    const next = targeted.name ?? `${app?.jobTitle ?? ''} — ${app?.company ?? ''}`.trim();
    setName(next);
    lastSavedNameRef.current = next;
  }, [targeted, app?.jobTitle, app?.company]);

  // Debounce name patches so we don't hammer the API on every keystroke.
  useEffect(() => {
    if (!targeted) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    if (trimmed === lastSavedNameRef.current) return;
    const handle = window.setTimeout(() => {
      lastSavedNameRef.current = trimmed;
      patchName.mutate({ name: trimmed });
    }, 600);
    return () => window.clearTimeout(handle);
    // patchName mutation identity is stable for the page lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, targeted]);

  async function handleDownload() {
    setDownloadError(null);
    try {
      const blob = await applicationApi.downloadTargetedCvPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const slug =
        (name || `${app?.jobTitle ?? 'targeted'}-${app?.company ?? 'cv'}`)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 80) || 'targeted-cv';
      a.download = `${slug}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(extractApiError(err).message);
    }
  }

  return (
    <AppShell title="Targeted CV" subtitle={app?.jobTitle}>
      <SplitPaneShell
        open={builder.state.isOpen}
        onClose={builder.close}
        rightTitle="Edit targeted CV"
        rightSubtitle={
          app ? `${app.jobTitle} · ${app.company}` : undefined
        }
        right={
          <BuilderPanel
            mode="targeted"
            applicationId={id}
            section={builder.state.section}
            onSaved={builder.close}
          />
        }
        left={
          <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          to={`/applications/${id}`}
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-gray-600 hover:text-[#15803d]"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to application
        </Link>
        <Button type="button" onClick={() => target.mutate()} disabled={target.isPending}>
          <SparklesIcon className="w-4 h-4" />
          {target.isPending ? 'Tailoring…' : targeted ? 'Regenerate' : 'Tailor CV with AI'}
        </Button>
      </div>

      {target.isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[13px] text-rose-700">
          Could not generate. Make sure you have a CV uploaded on the Profile page, then try again.
        </div>
      )}

      {targeted ? (
        <>
          <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
            <label className="block">
              <span className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
                Resume name
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`${app?.jobTitle ?? ''} — ${app?.company ?? ''}`}
                maxLength={120}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] text-gray-900 outline-none focus:border-[#15803d] focus:ring-2 focus:ring-[#15803d]/20"
              />
              <span className="mt-1 block text-[12px] text-gray-500">
                {patchName.isPending
                  ? 'Saving…'
                  : 'Used as the PDF filename when you download this resume.'}
              </span>
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" onClick={handleDownload}>
                Download PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRefineOpen(true)}
                disabled={!targeted.structured || isStructuredCvSparse(targeted.structured)}
              >
                <span className="inline-flex items-center gap-1.5">
                  <SparklesIcon className="w-4 h-4" /> Refine with AI
                </span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => builder.open({})}
                disabled={!targeted.structured || isStructuredCvSparse(targeted.structured)}
              >
                Edit this resume
              </Button>
            </div>
            {downloadError ? (
              <div className="mt-3 text-[13px] text-rose-600">{downloadError}</div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
            <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
              Why these changes
            </div>
            <p className="mt-2 text-[14px] text-gray-700 leading-relaxed">
              {targeted.rationale}
            </p>
          </div>
          <AtsScoreCard score={targeted.atsScore} variant="cv" />
          <CvDiffViewer segments={targeted.diff} />
          <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
                Final tailored CV
              </div>
              {reparse.isPending ? (
                <span className="text-[12px] font-semibold text-gray-500">
                  Auto-formatting…
                </span>
              ) : null}
            </div>
            {targeted.structured && !isStructuredCvSparse(targeted.structured) ? (
              // Same styled preview the editor uses on the right pane and the
              // PDF renders — keeps presentation identical end-to-end.
              <div className="mt-4">
                <CvPreview cv={targeted.structured} />
              </div>
            ) : (
              // Fallback while structured isn't available yet (auto-reparse in
              // flight, or AI couldn't structure the text). Still readable.
              <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-[14px] leading-relaxed text-gray-800">
                {targeted.text}
              </pre>
            )}
          </div>
        </>
      ) : (
        !target.isPending && (
          <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center">
            <h2 className="text-[18px] font-semibold text-[#111827]">Not tailored yet</h2>
            <p className="mt-1 text-[13px] text-gray-500">
              Click <span className="font-semibold">Tailor CV with AI</span> to generate a targeted
              version of your base CV for this role.
            </p>
          </div>
        )
      )}
      {refineOpen && targeted?.structured && !isStructuredCvSparse(targeted.structured) ? (
        <RefineChatDrawer
          applicationId={id}
          currentStructured={targeted.structured}
          onApply={(updated) => {
            // Persist directly — there's no in-memory editor draft on this
            // page, so applying = saving.
            patchName.mutate({ structured: updated });
          }}
          onClose={() => setRefineOpen(false)}
        />
      ) : null}
          </div>
        }
      />
    </AppShell>
  );
}
