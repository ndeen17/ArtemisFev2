import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { AnalysisCard } from '@/components/analysis/AnalysisCard';
import { BulletFeedbackList } from '@/components/profile/BulletFeedback';
import { KeywordGapList } from '@/components/profile/KeywordGapList';
import { useMyCv } from '@/hooks/useOnboarding';
import { useLatestAnalysis } from '@/hooks/useAnalysis';
import { ArrowRightIcon, ArrowLeftIcon, SparklesIcon } from '@/components/ui/icons';

/**
 * PRF-02 — CV analysis detail page. Renders the full AnalysisCard (score, strengths,
 * gaps, suggestions) plus the new bullet-by-bullet feedback and keyword gaps surfaced
 * by the Phase 5 prompt extension.
 */
export default function CvAnalysisPage() {
  const cv = useMyCv();
  const analysis = useLatestAnalysis();
  const result = analysis.data?.status === 'done' ? analysis.data.result : null;

  return (
    <AppShell title="CV analysis" subtitle="Bullet-by-bullet feedback from Artemis">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          to="/profile"
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-gray-600 hover:text-[#15803d]"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to profile
        </Link>
        <Link
          to="/profile/cv/rewrite"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] text-[#15803d] px-4 py-2 text-[13px] font-semibold hover:bg-[#bbf7d0]"
        >
          <SparklesIcon className="w-4 h-4" /> Open rewriter <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>

      <AnalysisCard analysis={analysis.data} isLoading={analysis.isLoading} hasCv={!!cv.data} />

      {result && (
        <>
          <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8">
            <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
              Bullet-level feedback
            </div>
            <h2 className="mt-1 text-[20px] font-semibold text-[#111827]">
              How your achievements land
            </h2>
            <p className="mt-1 text-[13px] text-gray-500">
              Tap <span className="font-semibold text-[#111827]">Rewrite</span> on any bullet to
              open it in the rewriter.
            </p>
            <div className="mt-6">
              <BulletFeedbackList items={result.bulletFeedback ?? []} />
            </div>
          </section>

          <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8">
            <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
              Keyword gaps
            </div>
            <h2 className="mt-1 text-[20px] font-semibold text-[#111827]">
              Skills the role expects but your CV doesn&apos;t mention
            </h2>
            <div className="mt-6">
              <KeywordGapList keywords={result.keywordGaps ?? []} />
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}
