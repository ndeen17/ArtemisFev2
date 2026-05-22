import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { CvPreview } from '@/components/cv/CvPreview';
import { Button } from '@/components/ui/Button';
import { ArrowLeftIcon, SpinnerIcon } from '@/components/ui/icons';
import { useMyCv } from '@/hooks/useOnboarding';
import { useApplication } from '@/hooks/useApplications';
import { cvApi } from '@/features/onboarding/api';
import { applicationApi } from '@/features/applications/api';
import { extractApiError } from '@/hooks/useAuth';
import { emptyStructuredCv } from '@/lib/structuredCv';

/**
 * Dedicated preview surface for the inline CV builder.
 *
 * Why this exists:
 *   The inline builder lives in `SplitPaneShell` and would otherwise have to
 *   render the editor and the preview side-by-side inside the same right
 *   pane. On smaller "xl" viewports that forces them to overlap. Instead,
 *   the editor surfaces a "Preview" button that navigates here, where the
 *   user gets a full-width preview, a Download PDF button, and a
 *   "Continue editing" button that takes them back to the exact builder
 *   URL they came from (`?back=` query param).
 *
 * Two route entries reuse this component:
 *   - `/profile/cv/preview` (canonical CV)
 *   - `/applications/:id/cv-review/preview` (targeted CV)
 */
function ProfilePreview() {
  const cvQuery = useMyCv();
  const location = useLocation();
  const navigate = useNavigate();
  const back = new URLSearchParams(location.search).get('back') || '/profile?builder=1';
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (cvQuery.isLoading) {
    return (
      <AppShell title="Preview" subtitle="Loading your CV…">
        <div className="flex items-center gap-2 text-gray-500">
          <SpinnerIcon /> Loading…
        </div>
      </AppShell>
    );
  }
  if (!cvQuery.data) {
    return (
      <AppShell title="CV preview" subtitle="No CV uploaded yet.">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 text-[14px] text-gray-600 space-y-4">
          <p>You don&apos;t have a CV on file yet, so there&apos;s nothing to preview.</p>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#15803d] hover:underline"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Back to resume
          </Link>
        </div>
      </AppShell>
    );
  }

  const structured = cvQuery.data.structured ?? emptyStructuredCv();

  async function download() {
    if (!cvQuery.data) return;
    setDownloadError(null);
    setDownloading(true);
    try {
      const blob = await cvApi.downloadPdf(cvQuery.data.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-cv.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(extractApiError(err).message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <AppShell title="CV preview" subtitle="What recruiters and the PDF will look like.">
      <PreviewToolbar
        backHref={back}
        onContinue={() => navigate(back)}
        onDownload={download}
        downloading={downloading}
      />
      {downloadError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
          {downloadError}
        </div>
      ) : null}
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4 sm:p-6">
        <CvPreview cv={structured} />
      </div>
    </AppShell>
  );
}

function TargetedPreview() {
  const { id = '' } = useParams<{ id: string }>();
  const appQuery = useApplication(id);
  const location = useLocation();
  const navigate = useNavigate();
  const back =
    new URLSearchParams(location.search).get('back') ||
    `/applications/${id}/cv-review?builder=1`;
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (appQuery.isLoading) {
    return (
      <AppShell title="Preview" subtitle="Loading targeted CV…">
        <div className="flex items-center gap-2 text-gray-500">
          <SpinnerIcon /> Loading…
        </div>
      </AppShell>
    );
  }
  const targeted = appQuery.data?.targetedCv ?? null;
  if (!targeted) {
    return (
      <AppShell
        title="Targeted CV preview"
        subtitle={
          appQuery.data ? `${appQuery.data.jobTitle} · ${appQuery.data.company}` : undefined
        }
      >
        <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 text-[14px] text-gray-600 space-y-4">
          <p>No targeted CV exists for this application yet. Tailor one first to enable preview.</p>
          <Link
            to={`/applications/${id}/cv-review`}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#15803d] hover:underline"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Back to review
          </Link>
        </div>
      </AppShell>
    );
  }

  const structured = targeted.structured ?? emptyStructuredCv();

  async function download() {
    setDownloadError(null);
    setDownloading(true);
    try {
      const blob = await applicationApi.downloadTargetedCvPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(targeted?.name ?? 'targeted-cv')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'targeted-cv'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(extractApiError(err).message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <AppShell
      title="Targeted CV preview"
      subtitle={
        appQuery.data ? `${appQuery.data.jobTitle} · ${appQuery.data.company}` : undefined
      }
    >
      <PreviewToolbar
        backHref={back}
        onContinue={() => navigate(back)}
        onDownload={download}
        downloading={downloading}
      />
      {downloadError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
          {downloadError}
        </div>
      ) : null}
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4 sm:p-6">
        <CvPreview cv={structured} />
      </div>
    </AppShell>
  );
}

function PreviewToolbar({
  backHref,
  onContinue,
  onDownload,
  downloading,
}: {
  backHref: string;
  onContinue: () => void;
  onDownload: () => void;
  downloading: boolean;
}) {
  return (
    <div
      // Sticky so the user can keep "Continue editing" and Download in reach
      // while scrolling a long CV. `print:hidden` keeps the toolbar out of
      // the printed output — Ctrl+P should give the same look as the PDF.
      className="sticky top-16 z-10 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 py-3 bg-[#fafafa]/95 backdrop-blur border-b border-gray-100 print:hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Use a real Link as a fallback navigation target so right-click /
            middle-click "Open in new tab" still does something sensible. */}
        <Link
          to={backHref}
          onClick={(e) => {
            e.preventDefault();
            onContinue();
          }}
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-gray-600 hover:text-[#15803d]"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Continue editing
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-gray-700 hover:bg-gray-50"
          >
            Print
          </button>
          <Button type="button" onClick={onDownload} disabled={downloading}>
            {downloading ? (
              <span className="inline-flex items-center gap-2">
                <SpinnerIcon /> Preparing…
              </span>
            ) : (
              'Download PDF'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CvPreviewPage({ mode }: { mode: 'profile' | 'targeted' }) {
  return mode === 'profile' ? <ProfilePreview /> : <TargetedPreview />;
}
