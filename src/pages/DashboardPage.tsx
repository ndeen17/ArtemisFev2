import { Link } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { deriveReadiness, roleLabel } from '@artemis/shared';
import { AppShell } from '@/components/layout/AppShell';
import { useMyCv, useOnboardingState } from '@/hooks/useOnboarding';
import { useLatestAnalysis } from '@/hooks/useAnalysis';
import { useProfileOverview } from '@/hooks/useProfile';
import { useInterview, useInterviews } from '@/hooks/useInterviews';
import { ResumeReadinessCard } from '@/components/dashboard/ResumeReadinessCard';
import { SetupProgressCard } from '@/components/dashboard/SetupProgressCard';
import { AnalysingResumeCard } from '@/components/dashboard/AnalysingResumeCard';
import { ActionList, type WeakInterviewSummary } from '@/components/dashboard/ActionList';
import { useAuthStore } from '@/store/authStore';
import { useGoalCopy } from '@/hooks/useGoal';
import { ArrowRightIcon } from '@/components/ui/icons';
import { useToast } from '@/components/ui/Toast';

const INTERVIEW_WEAK_THRESHOLD = 70;

/**
 * Dashboard. Single source of truth for "where am I right now". All numbers
 * come from real persisted data — readiness is derived locally via
 * shared/domain/readiness from onboarding state + CV summary + latest analysis.
 *
 * UX rules (post-redesign):
 *  - One hero, one primary CTA. The CTA is goal-driven (`useGoalCopy()`); when
 *    no goal is set, it routes to `/settings/goal` automatically, so we don't
 *    need a separate `NoGoalPrompt` card competing for the same intent.
 *  - One readiness signal. `ResumeReadinessCard` mirrors the Profile hero
 *    number (no ring, no per-component breakdown) — deep view lives at
 *    `/profile`.
 *  - Setup progress disappears at 100%. Action list always leads remaining
 *    work; setup is the support card below it.
 *  - No `CvSummaryCard` — metadata-for-metadata's-sake; the resume page
 *    owns CV details.
 */
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const onboarding = useOnboardingState();
  const cv = useMyCv();
  const analysis = useLatestAnalysis();
  const overview = useProfileOverview();
  const interviews = useInterviews();
  const { goal, copy } = useGoalCopy();
  const toast = useToast();

  // One-shot nudge for users who skipped the in-onboarding CV editor. The
  // flag is set by /onboarding/cv/edit's "Skip for now" button and cleared
  // here on first dashboard mount.
  useEffect(() => {
    let pending = false;
    try {
      pending = localStorage.getItem('artemis:cvDraftPending') === '1';
      if (pending) localStorage.removeItem('artemis:cvDraftPending');
    } catch {
      /* storage disabled — non-fatal */
    }
    if (!pending) return;
    toast.push({
      tone: 'info',
      title: 'Your CV is still a starter draft',
      description: 'Polish it whenever you’re ready from Resume → Edit CV.',
      durationMs: 8000,
    });
  }, [toast]);

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
    <AppShell title="Home" subtitle={copy.dashboardSubtitle}>
      {/* Hero — leads the page. Bigger greeting (`text-[40px]+`) so it
          outweighs the readiness card below, restoring hierarchy after the
          Profile hero bump. Single primary CTA from goal copy. */}
      <div>
        <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
          {copy.dashboardEyebrow}
        </div>
        <h1 className="mt-1 text-[40px] sm:text-[44px] font-extrabold tracking-tight text-ink leading-[1.05]">
          Hi, {firstName}.
        </h1>
        {/* Role pill — fastest read of "who are you optimising for?" */}
        {roleLabel(onboarding.data?.role) ? (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-[12px] font-semibold text-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-green" aria-hidden="true" />
            {roleLabel(onboarding.data?.role)}
          </div>
        ) : null}
        <p className="mt-3 text-[15px] text-ink-muted max-w-xl">{copy.dashboardSubtitle}</p>
        <div className="mt-5">
          <Link
            to={copy.primaryCtaTo}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-green text-white px-5 py-2.5 text-[14px] font-semibold hover:bg-brand-greenInk transition-colors"
            data-goal={goal ?? 'none'}
          >
            {copy.primaryCtaLabel} <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Readiness signal — analysing OR score OR empty. One card, three states.
          NEVER stacked with another progress visual. */}
      {isAnalysing ? (
        <AnalysingResumeCard />
      ) : (
        <ResumeReadinessCard
          overview={overview.data}
          isLoading={overview.isLoading}
          hasCv={!!cv.data}
        />
      )}

      {/* Action list — the workhorse. Sits above setup progress because
          "what to do next" is more important than "finish onboarding". */}
      <ActionList
        readiness={snapshot}
        analysis={analysis.data ?? null}
        hasCv={!!cv.data}
        goal={goal}
        weakInterview={weakInterview}
      />

      {/* Setup progress — hidden at 100%, shows only remaining factors.
          Demoted below ActionList so it doesn't compete for top-of-page. */}
      <SetupProgressCard snapshot={snapshot} />
    </AppShell>
  );
}
