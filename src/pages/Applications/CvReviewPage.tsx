import { Link, useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { ArrowLeftIcon, SparklesIcon } from '@/components/ui/icons';
import { CvDiffViewer } from '@/components/applications/CvDiffViewer';
import { useApplication, useTargetCv } from '@/hooks/useApplications';

/**
 * APP-03 — Targeted CV review. Triggers /applications/:id/target-cv and renders
 * the diff returned by the backend.
 */
export default function CvReviewPage() {
  const { id = '' } = useParams<{ id: string }>();
  const query = useApplication(id);
  const target = useTargetCv(id);
  const app = query.data;

  return (
    <AppShell title="Targeted CV" subtitle={app?.jobTitle}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          to={`/applications/${id}`}
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-gray-600 hover:text-[#15803d]"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to application
        </Link>
        <Button type="button" onClick={() => target.mutate()} disabled={target.isPending}>
          <SparklesIcon className="w-4 h-4" />
          {target.isPending ? 'Tailoring…' : app?.targetedCv ? 'Regenerate' : 'Tailor CV with AI'}
        </Button>
      </div>

      {target.isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[13px] text-rose-700">
          Could not generate. Make sure you have a CV uploaded on the Profile page, then try again.
        </div>
      )}

      {app?.targetedCv ? (
        <>
          <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
            <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
              Why these changes
            </div>
            <p className="mt-2 text-[14px] text-gray-700 leading-relaxed">
              {app.targetedCv.rationale}
            </p>
          </div>
          <CvDiffViewer segments={app.targetedCv.diff} />
          <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
            <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
              Final tailored CV
            </div>
            <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-[14px] leading-relaxed text-gray-800">
              {app.targetedCv.text}
            </pre>
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
    </AppShell>
  );
}
