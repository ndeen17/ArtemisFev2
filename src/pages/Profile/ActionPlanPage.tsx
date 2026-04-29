import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ActionPlan } from '@/components/profile/ActionPlan';
import { useActionPlan } from '@/hooks/useProfile';
import { ArrowLeftIcon } from '@/components/ui/icons';

/**
 * PRF-06 — Standalone action plan page. Same component used as a section on the
 * profile overview, given its own page so it can be deep-linked from the dashboard
 * and grow source-filter UI in later phases (LinkedIn, applications, interviews).
 */
export default function ActionPlanPage() {
  const plan = useActionPlan();

  return (
    <AppShell title="Action plan" subtitle="Everything Artemis recommends, in priority order">
      <div>
        <Link
          to="/profile"
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-gray-600 hover:text-[#15803d]"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to profile
        </Link>
      </div>

      <ActionPlan plan={plan.data} isLoading={plan.isLoading} />
    </AppShell>
  );
}
