import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { SplitPaneShell } from '@/components/layout/SplitPaneShell';
import { ResumeReadinessHeader } from '@/components/profile/ResumeReadinessHeader';
import { ActionPlan } from '@/components/profile/ActionPlan';
import { ContinuitySummaryCard } from '@/components/profile/ContinuitySummaryCard';
import { ScoreDetailsAccordion } from '@/components/profile/ScoreDetailsAccordion';
import { BuilderPanel } from '@/components/cv/BuilderPanel';
import { useMyCv } from '@/hooks/useOnboarding';
import { useProfileOverview, useActionPlan, useContinuity } from '@/hooks/useProfile';
import { useBuilderUrlState } from '@/hooks/useBuilderUrlState';
import { useLatestAnalysis } from '@/hooks/useAnalysis';
import { LockIcon } from '@/components/ui/icons';

/**
 * PRF-01 entry point. Aggregates the overview card + action plan and surfaces
 * deep links to the CV analysis and the inline builder.
 *
 * Inline editing model:
 *   - All "Fix in builder" / "Edit my CV" CTAs flip URL state via
 *     `useBuilderUrlState` (?builder=1&section=&focus=&coach=). The
 *     `SplitPaneShell` then renders the builder side-by-side on xl+ screens
 *     or as a full-screen sheet below.
 *   - The legacy `/profile/cv/edit` route redirects to `/profile?builder=1`.
 *
 * If the user just landed here from a fresh first-ever analysis (firstReveal=true)
 * we redirect to the score-reveal page so they get the celebratory moment exactly once.
 */
export default function ProfilePage() {
  const cv = useMyCv();
  const overview = useProfileOverview();
  const plan = useActionPlan();
  const continuity = useContinuity();
  const analysis = useLatestAnalysis();
  const builder = useBuilderUrlState();
  const navigate = useNavigate();
  const location = useLocation();

  if (overview.data?.firstReveal) {
    return <Navigate to="/profile/score-reveal" replace />;
  }

  const builderOpen = builder.state.isOpen;

  // When the inline builder is open we show a deliberately slim left
  // column so the editor has room to breathe. Only the essentials remain:
  // a compact readiness chip (so the user keeps eyes on the score) and the
  // action plan (because that's where most "Fix" CTAs live, and clicking
  // any of them updates which section the builder is editing).
  //
  // The full overview card, rubric breakdown, and deep-link tiles are
  // hidden until the builder is closed — they're navigation/context the
  // user doesn't need while they're mid-edit.
  const left = builderOpen ? (
    <div className="space-y-5">
      <CompactReadinessChip
        score={overview.data?.readinessScore ?? null}
        weeklyDelta={overview.data?.weeklyDelta ?? null}
      />
      <ActionPlan
        plan={plan.data}
        isLoading={plan.isLoading}
        onOpenBuilder={builder.open}
      />
    </div>
  ) : (
    <div className="space-y-6">
      <ResumeReadinessHeader
        overview={overview.data}
        isLoading={overview.isLoading}
        hasCv={!!cv.data}
        onEditCv={() => builder.open({})}
      />

      <ContinuitySummaryCard
        continuity={continuity.data}
        isLoading={continuity.isLoading}
      />

      <ActionPlan
        plan={plan.data}
        isLoading={plan.isLoading}
        onOpenBuilder={builder.open}
      />

      <ScoreDetailsAccordion
        rubricItems={overview.data?.rubricBreakdown ?? []}
        rubricScore={overview.data?.rubricScore ?? null}
        llmScore={overview.data?.llmScore ?? null}
        analysisStatus={overview.data?.analysisStatus ?? 'none'}
        onOpenBuilder={builder.open}
      />

      <LinkedInComingSoonNote />
    </div>
  );

  return (
    <AppShell title="Resume" subtitle="Your CV, your scores, and what to do next">
      <SplitPaneShell
        open={builder.state.isOpen}
        onClose={builder.close}
        rightTitle="Edit your CV"
        rightSubtitle="Changes save to your canonical CV."
        onPreview={() => {
          const back = `${location.pathname}${location.search}`;
          navigate(`/profile/cv/preview?back=${encodeURIComponent(back)}`);
        }}
        left={left}
        right={
          <BuilderPanel
            mode="profile"
            section={builder.state.section}
            focus={builder.state.focus}
            itemId={builder.state.itemId}
            bulletIndex={builder.state.bulletIndex}
            field={builder.state.field}
            why={builder.state.why}
            missingKeywords={
              analysis.data?.status === 'done' ? analysis.data.result?.keywordGaps ?? [] : []
            }
            onSaved={builder.close}
          />
        }
      />
    </AppShell>
  );
}

/**
 * Small footer note while LinkedIn is unshipped. Replaces the previous two
 * placeholder cards (a "LinkedIn score" tile in the overview and a separate
 * "LinkedIn analysis" deep-link tile) — one mention is plenty.
 */
function LinkedInComingSoonNote() {
  return (
    <div className="flex items-center justify-center gap-2 text-[12px] text-gray-400">
      <LockIcon className="w-3.5 h-3.5" />
      LinkedIn signals will fold in here once they ship.
    </div>
  );
}

/**
 * Slim score indicator shown at the top of the profile column **only**
 * while the inline builder is open. Keeps the readiness number visible
 * without the visual weight of the full ProfileOverviewCard.
 */
function CompactReadinessChip({
  score,
  weeklyDelta,
}: {
  score: number | null;
  weeklyDelta: number | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-green">
          Resume readiness
        </div>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="text-[22px] font-extrabold tabular-nums text-[#111827]">
            {score === null ? '—' : score}
          </span>
          <span className="text-[12px] text-gray-500">/ 100</span>
          {typeof weeklyDelta === 'number' && weeklyDelta !== 0 ? (
            <span
              className={
                'text-[11px] font-semibold ' +
                (weeklyDelta > 0 ? 'text-emerald-600' : 'text-rose-600')
              }
            >
              {weeklyDelta > 0 ? '+' : ''}
              {weeklyDelta}
            </span>
          ) : null}
        </div>
      </div>
      <span className="text-[11px] text-gray-400">
        Editing your CV — close to see details
      </span>
    </div>
  );
}
