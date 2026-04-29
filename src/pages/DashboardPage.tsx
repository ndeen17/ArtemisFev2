import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { deriveReadiness } from '@artemis/shared';
import { AppShell } from '@/components/layout/AppShell';
import { useMyCv, useOnboardingState } from '@/hooks/useOnboarding';
import { useLatestAnalysis } from '@/hooks/useAnalysis';
import { useInterview, useInterviews } from '@/hooks/useInterviews';
import { ReadinessScoreCard } from '@/components/dashboard/ReadinessScoreCard';
import { AnalysingResumeCard } from '@/components/dashboard/AnalysingResumeCard';
import { ActionList, type WeakInterviewSummary } from '@/components/dashboard/ActionList';
import { NoGoalPrompt } from '@/components/dashboard/NoGoalPrompt';
import { useAuthStore } from '@/store/authStore';
import { useGoalCopy } from '@/hooks/useGoal';
import { ArrowRightIcon } from '@/components/ui/icons';

const INTERVIEW_WEAK_THRESHOLD = 70;

/**
 * Dashboard. Single source of truth for "where am I right now". All numbers
 * come from real persisted data — readiness is derived locally via
 * shared/domain/readiness from onboarding state + CV summary + latest analysis.
 *
 * Phase 6: hero copy, primary CTA, and ActionList ordering all flow from the user's
 * goal via `useGoalCopy()`. When no goal is set we surface a NoGoalPrompt and fall
 * back to neutral copy.
 */
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const onboarding = useOnboardingState();
  const cv = useMyCv();
  const analysis = useLatestAnalysis();
  const interviews = useInterviews();
  const { goal, copy, hasGoal } = useGoalCopy();

  // Find the most recent completed interview whose summary score is below the weak threshold.
  const weakInterviewId = useMemo<string | null>(() => {
    const list = interviews.data ?? [];
    const sorted = [...list]
      .filter(
        (s) =>
          s.status === 'completed' &&
          typeof s.overallScore === 'number' &&
          s.overallScore < INTERVIEW_WEAK_THRESHOLD,
      )
      .sort((a, b) => {
        const ta = a.endedAt ? new Date(a.endedAt).getTime() : 0;
        const tb = b.endedAt ? new Date(b.endedAt).getTime() : 0;
        return tb - ta;
      });
    return sorted[0]?.id ?? null;
  }, [interviews.data]);

  // Pull the full session (with debrief) only when we have a weak candidate.
  const weakInterviewDetail = useInterview(weakInterviewId ?? undefined);

  const weakInterview = useMemo<WeakInterviewSummary | null>(() => {
    const s = weakInterviewDetail.data;
    if (!s || !s.debrief) return null;
    if (s.debrief.overallScore >= INTERVIEW_WEAK_THRESHOLD) return null;
    const next = s.debrief.nextActions?.[0] ?? null;
    return {
      interviewId: s.id,
      overallScore: s.debrief.overallScore,
      nextAction: next ? { title: next.title, detail: next.detail, link: next.link } : null,
      weakness: s.debrief.weaknesses?.[0] ?? null,
    };
  }, [weakInterviewDetail.data]);

  const snapshot = deriveReadiness({
    onboarding: onboarding.data
      ? { onboardingComplete: onboarding.data.onboardingComplete, hasCv: onboarding.data.hasCv }
      : null,
    cv: cv.data ? { id: cv.data.id, source: cv.data.source, charCount: cv.data.charCount } : null,
    analysis: analysis.data ? { status: analysis.data.status, result: analysis.data.result } : null,
  });

  const firstName = (() => {
    const raw = user?.displayName?.trim();
    if (raw) return raw.split(/\s+/)[0];
    return user?.email?.split('@')[0] ?? 'there';
  })();

  const analysisStatus = analysis.data?.status;
  const isAnalysing =
    !!cv.data && (analysisStatus === 'queued' || analysisStatus === 'running');

  return (
    <AppShell title="Dashboard" subtitle={copy.dashboardSubtitle}>
      <div>
        <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
          {copy.dashboardEyebrow}
        </div>
        <h1 className="mt-1 text-[32px] font-extrabold tracking-tight text-[#111827] leading-[1.1]">
          Hi, {firstName}.
        </h1>
        <p className="mt-2 text-[15px] text-gray-600 max-w-xl">{copy.dashboardSubtitle}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to={copy.primaryCtaTo}
            className="inline-flex items-center gap-1 rounded-full bg-brand-green text-white px-5 py-2.5 text-[14px] font-semibold hover:bg-[#15803d]"
            data-goal={goal ?? 'none'}
          >
            {copy.primaryCtaLabel} <ArrowRightIcon />
          </Link>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-5 py-2.5 text-[14px] font-semibold text-[#111827] hover:bg-gray-50"
          >
            Open profile
          </Link>
        </div>
      </div>

      {!hasGoal ? <NoGoalPrompt /> : null}

      {isAnalysing ? <AnalysingResumeCard /> : <ReadinessScoreCard snapshot={snapshot} />}

      <ActionList
        readiness={snapshot}
        analysis={analysis.data ?? null}
        hasCv={!!cv.data}
        goal={goal}
        weakInterview={weakInterview}
      />

      <CvSummaryCard loading={cv.isLoading} cv={cv.data ?? null} />
    </AppShell>
  );
}

function CvSummaryCard({
  loading,
  cv,
}: {
  loading: boolean;
  cv: { filename: string | null; charCount: number; source: string; createdAt: string } | null;
}) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            Your CV
          </div>
          <h2 className="text-[18px] font-semibold text-[#111827] mt-1">
            {cv?.filename ?? (cv ? 'Generated CV' : 'No CV on file yet')}
          </h2>
          {loading ? (
            <p className="mt-2 text-[14px] text-gray-500">Loading…</p>
          ) : cv ? (
            <p className="mt-2 text-[13px] text-gray-500">
              {cv.charCount.toLocaleString()} characters · source: {cv.source} · saved{' '}
              {new Date(cv.createdAt).toLocaleString()}
            </p>
          ) : (
            <p className="mt-2 text-[14px] text-gray-500">
              Add a CV to unlock the full readiness picture.
            </p>
          )}
        </div>
        <Link
          to="/profile"
          className="inline-flex items-center gap-1 rounded-full bg-[#fafafa] border border-gray-100 px-4 py-2 text-[13px] font-semibold text-[#111827] hover:bg-gray-100"
        >
          Open profile
        </Link>
      </div>
    </section>
  );
}
