import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { CvUploader } from '@/components/onboarding/CvUploader';
import { Button } from '@/components/ui/Button';
import { SpinnerIcon, FileIcon, SparklesIcon, CheckIcon } from '@/components/ui/icons';
import { useMyCv, useUploadCv } from '@/hooks/useOnboarding';
import { useLatestAnalysis, useRefreshAnalysis } from '@/hooks/useAnalysis';
import { extractApiError } from '@/hooks/useAuth';

const SOURCE_LABEL: Record<string, string> = {
  upload: 'Uploaded file',
  jd: 'Generated from job description',
  questionnaire: 'Generated from questionnaire',
};

/**
 * SETTINGS-RESUME — manage the user's canonical CV.
 *
 * Shows the current CV (filename, source, last updated) plus the live
 * analysis status. Re-uploading replaces it: the BE creates a new CV
 * document, queues a fresh analysis automatically, and the dashboard /
 * profile both pick up the new score on their next poll because we
 * invalidate `analysis.latest` here.
 */
export default function SettingsResumePage() {
  const cvQuery = useMyCv();
  const analysisQuery = useLatestAnalysis();
  const upload = useUploadCv();
  const refresh = useRefreshAnalysis();
  const [error, setError] = useState<string | null>(null);
  const [justUploaded, setJustUploaded] = useState(false);

  const cv = cvQuery.data;
  const analysis = analysisQuery.data;
  const analysing = analysis?.status === 'queued' || analysis?.status === 'running';

  async function handleUpload(file: File) {
    setError(null);
    setJustUploaded(false);
    try {
      await upload.mutateAsync(file);
      setJustUploaded(true);
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  return (
    <SettingsLayout subtitle="Replace your CV — we'll re-analyse it for you straight away.">
      <div>
        <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
          Settings
        </div>
        <h1 className="mt-1 text-[28px] font-extrabold tracking-tight text-[#111827]">
          Your resume
        </h1>
        <p className="mt-2 text-[15px] text-gray-600 max-w-xl">
          Upload a new CV to replace the one we have on file. As soon as it lands, we'll
          re-analyse it and update your readiness score.
        </p>
      </div>

      {/* Current CV summary card */}
      <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8 space-y-5">
        <div className="text-[14px] font-semibold text-[#111827]">Current CV</div>

        {cvQuery.isLoading ? (
          <div className="flex items-center gap-2 text-[14px] text-gray-500">
            <SpinnerIcon className="animate-spin" /> Loading…
          </div>
        ) : !cv ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-[#fafafa] p-6 text-center">
            <p className="text-[14px] text-gray-600">
              You don't have a CV on file yet. Upload one below to get started.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-[#fafafa] p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ecfdf5] text-brand-green shrink-0">
                <FileIcon />
              </span>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-[#111827] truncate">
                  {cv.filename ?? 'Generated CV'}
                </div>
                <div className="text-[12px] text-gray-500 truncate">
                  {SOURCE_LABEL[cv.source] ?? cv.source} · last updated{' '}
                  {new Date(cv.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/profile/cv/edit"
                className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] font-semibold text-[#111827] hover:bg-gray-50"
              >
                Edit in builder
              </Link>
            </div>
          </div>
        )}

        {/* Analysis status pill */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#f0fdf4] px-3 py-1 text-[12px] font-semibold text-[#15803d]">
            <SparklesIcon width={14} height={14} className="text-[#15803d]" />
            {analysing
              ? 'Re-analysing your CV…'
              : analysis?.status === 'done'
                ? `Analysis up to date${
                    typeof analysis.result?.overallScore === 'number'
                      ? ` · ${analysis.result.overallScore}/100`
                      : ''
                  }`
                : analysis?.status === 'failed'
                  ? 'Last analysis failed'
                  : 'No analysis yet'}
          </div>
          {cv && !analysing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refresh.mutate()}
              disabled={refresh.isPending}
            >
              {refresh.isPending ? 'Re-analysing…' : 'Re-analyse'}
            </Button>
          ) : null}
        </div>
      </section>

      {/* Upload / replace card */}
      <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8 space-y-4">
        <div>
          <div className="text-[14px] font-semibold text-[#111827]">
            {cv ? 'Replace your CV' : 'Upload your CV'}
          </div>
          <p className="mt-1 text-[13px] text-gray-500">
            PDF or plain text, up to 5MB. Uploading a new file replaces the previous one and
            triggers a fresh analysis automatically.
          </p>
        </div>

        <CvUploader onUpload={handleUpload} pending={upload.isPending} errorMessage={error} />

        {justUploaded ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-[#dcfce7] px-3 py-1 text-[12px] font-semibold text-[#15803d]">
            <CheckIcon width={14} height={14} stroke="#15803d" /> Replaced — analysing now
          </div>
        ) : null}
      </section>
    </SettingsLayout>
  );
}
