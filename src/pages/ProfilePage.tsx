import { Link, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProfileOverviewCard } from '@/components/profile/ProfileOverviewCard';
import { ActionPlan } from '@/components/profile/ActionPlan';
import { useMyCv } from '@/hooks/useOnboarding';
import { useProfileOverview, useActionPlan } from '@/hooks/useProfile';
import { ArrowRightIcon, FileIcon, LinkedInIcon, LockIcon } from '@/components/ui/icons';

/**
 * PRF-01 entry point. Aggregates the overview card + action plan and surfaces
 * deep links to the CV analysis, rewriter, and LinkedIn placeholder.
 *
 * If the user just landed here from a fresh first-ever analysis (firstReveal=true)
 * we redirect to the score-reveal page so they get the celebratory moment exactly once.
 */
export default function ProfilePage() {
  const cv = useMyCv();
  const overview = useProfileOverview();
  const plan = useActionPlan();

  if (overview.data?.firstReveal) {
    return <Navigate to="/profile/score-reveal" replace />;
  }

  return (
    <AppShell title="Profile" subtitle="Your CV, your scores, and what to do next">
      <ProfileOverviewCard overview={overview.data} isLoading={overview.isLoading} />

      <ActionPlan plan={plan.data} isLoading={plan.isLoading} />

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
        <DeepLink
          to="/profile/cv/edit"
          icon={<FileIcon className="text-[#15803d]" />}
          title="Edit my CV"
          subtitle={
            cv.data
              ? 'Refine each section with the live editor and AI coach.'
              : 'Add a CV to start editing.'
          }
        />
        <DeepLink
          to="/profile/linkedin"
          icon={<LinkedInIcon className="text-gray-500" />}
          title="LinkedIn analysis"
          subtitle="Coming soon — your LinkedIn signals will fold in here."
          locked
        />
      </section>
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
      <ArrowRightIcon className="shrink-0 text-gray-400 group-hover:text-[#15803d]" />
    </Link>
  );
}
