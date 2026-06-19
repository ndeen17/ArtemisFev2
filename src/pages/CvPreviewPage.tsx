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

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ProfilePreview() {
  const cvQuery = useMyCv();
  const location = useLocation();
  const navigate = useNavigate();
  const back = new URLSearchParams(location.search).get('back') || '/profile?builder=1';
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
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

  async function downloadPdf() {
    if (!cvQuery.data) return;
    setDownloadError(null);
    setDownloadingPdf(true);
    try {
      const blob = await cvApi.downloadPdf(cvQuery.data.id);
      triggerDownload(blob, 'my-cv.pdf');
    } catch (err) {
      setDownloadError(extractApiError(err).message);
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function downloadDocx() {
    if (!cvQuery.data) return;
    setDownloadError(null);
    setDownloadingDocx(true);
    try {
      const blob = await cvApi.downloadDocx(cvQuery.data.id);
      triggerDownload(blob, 'my-cv.docx');
    } catch (err) {
      setDownloadError(extractApiError(err).message);
    } finally {
      setDownloadingDocx(false);
    }
  }

  return (
    <AppShell title="CV preview" subtitle="What recruiters and the PDF will look like.">
      <PreviewToolbar
        backHref={back}
        onContinue={() => navigate(back)}
        onDownloadPdf={downloadPdf}
        onDownloadDocx={downloadDocx}
        downloadingPdf={downloadingPdf}
        downloadingDocx={downloadingDocx}
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
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
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

  function slugName() {
    return (targeted?.name ?? `${appQuery.data?.jobTitle ?? ''} ${appQuery.data?.company ?? ''}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'targeted-cv';
  }

  async function downloadPdf() {
    setDownloadError(null);
    setDownloadingPdf(true);
    try {
      const blob = await applicationApi.downloadTargetedCvPdf(id);
      triggerDownload(blob, `${slugName()}.pdf`);
    } catch (err) {
      setDownloadError(extractApiError(err).message);
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function downloadDocx() {
    setDownloadError(null);
    setDownloadingDocx(true);
    try {
      const blob = await applicationApi.downloadTargetedCvDocx(id);
      triggerDownload(blob, `${slugName()}.docx`);
    } catch (err) {
      setDownloadError(extractApiError(err).message);
    } finally {
      setDownloadingDocx(false);
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
        onDownloadPdf={downloadPdf}
        onDownloadDocx={downloadDocx}
        downloadingPdf={downloadingPdf}
        downloadingDocx={downloadingDocx}
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
  onDownloadPdf,
  onDownloadDocx,
  downloadingPdf,
  downloadingDocx,
}: {
  backHref: string;
  onContinue: () => void;
  onDownloadPdf: () => void;
  onDownloadDocx: () => void;
  downloadingPdf: boolean;
  downloadingDocx: boolean;
}) {
  return (
    <div
      // top-0: stick at the very top of the <main> scroll container.
      // The AppShell TopBar sits outside <main> so no extra offset is needed.
      // print:hidden keeps the toolbar out of Ctrl+P output.
      className="sticky top-0 z-10 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 py-3 bg-[#fafafa]/95 backdrop-blur border-b border-gray-100 print:hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
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

          {/* Word download — outlined style to visually distinguish from PDF */}
          <button
            type="button"
            onClick={onDownloadDocx}
            disabled={downloadingDocx}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {downloadingDocx ? (
              <span className="inline-flex items-center gap-1.5">
                <SpinnerIcon /> Preparing…
              </span>
            ) : (
              'Download Word'
            )}
          </button>

          <Button type="button" onClick={onDownloadPdf} disabled={downloadingPdf}>
            {downloadingPdf ? (
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
