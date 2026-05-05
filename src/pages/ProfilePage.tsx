import { Link, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { SplitPaneShell } from '@/components/layout/SplitPaneShell';
import { ProfileOverviewCard } from '@/components/profile/ProfileOverviewCard';
import { ActionPlan } from '@/components/profile/ActionPlan';
import { RubricBreakdown } from '@/components/profile/RubricBreakdown';
import { BuilderPanel } from '@/components/cv/BuilderPanel';
import { useMyCv } from '@/hooks/useOnboarding';
import { useProfileOverview, useActionPlan } from '@/hooks/useProfile';
import { useBuilderUrlState } from '@/hooks/useBuilderUrlState';
import { ArrowRightIcon, FileIcon, LinkedInIcon, LockIcon } from '@/components/ui/icons';

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
  const builder = useBuilderUrlState();

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
      <ProfileOverviewCard overview={overview.data} isLoading={overview.isLoading} />

      {overview.data?.rubricBreakdown && overview.data.rubricBreakdown.length > 0 ? (
        <RubricBreakdown
          items={overview.data.rubricBreakdown}
          rubricScore={overview.data.rubricScore ?? null}
          llmScore={overview.data.llmScore ?? null}
          onOpenBuilder={builder.open}
        />
      ) : null}

      <ActionPlan
        plan={plan.data}
        isLoading={plan.isLoading}
        onOpenBuilder={builder.open}
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DeepLink
          to="/profile/cv"
          icon={<FileIcon className="text-[#15803d]" />}
          title="CV analysis"
          subtitle={
            cv.data
              ? 'Bullet-by-bullet feedback and keyword gaps.'
              : 'Add a CV to unlock detailed feedback.'
          }
        />
        <DeepLinkButton
          icon={<FileIcon className="text-[#15803d]" />}
          title="Edit my CV"
          subtitle={
            cv.data
              ? 'Refine each section without leaving this page.'
              : 'Add a CV to start editing.'
          }
          onClick={() => builder.open({})}
          disabled={!cv.data}
        />
        <DeepLink
          to="/profile/linkedin"
          icon={<LinkedInIcon className="text-gray-500" />}
          title="LinkedIn analysis"
          subtitle="Coming soon — your LinkedIn signals will fold in here."
          locked
        />
      </section>
    </div>
  );

  return (
    <AppShell title="Profile" subtitle="Your CV, your scores, and what to do next">
      <SplitPaneShell
        open={builder.state.isOpen}
        onClose={builder.close}
        rightTitle="Edit your CV"
        rightSubtitle="Changes save to your canonical CV."
        left={left}
        right={
          <BuilderPanel
            mode="profile"
            section={builder.state.section}
            focus={builder.state.focus}
            coachOpen={builder.state.coachOpen}
            onSaved={builder.close}
          />
        }
      />
    </AppShell>
  );
}

function DeepLink({
  to,
  icon,
  title,
  subtitle,
  locked,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  locked?: boolean;
}) {
  return (
    <Link
      to={to}
      className="group flex items-start justify-between gap-4 rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-5 hover:border-brand-green/40 hover:shadow-md transition"
    >
      <TileBody icon={icon} title={title} subtitle={subtitle} locked={locked} />
      <ArrowRightIcon className="shrink-0 text-gray-400 group-hover:text-[#15803d]" />
    </Link>
  );
}

function DeepLinkButton({
  icon,
  title,
  subtitle,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex items-start justify-between gap-4 rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-5 text-left hover:border-brand-green/40 hover:shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <TileBody icon={icon} title={title} subtitle={subtitle} />
      <ArrowRightIcon className="shrink-0 text-gray-400 group-hover:text-[#15803d]" />
    </button>
  );
}

function TileBody({
  icon,
  title,
  subtitle,
  locked,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  locked?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      <div className="w-10 h-10 rounded-full bg-[#fafafa] inline-flex items-center justify-center">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-semibold text-[#111827]">{title}</h3>
          {locked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              <LockIcon className="w-3 h-3" /> Soon
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[13px] text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}
