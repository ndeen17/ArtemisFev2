import { Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ScoreReveal } from '@/components/profile/ScoreReveal';
import { useProfileOverview } from '@/hooks/useProfile';
import { SpinnerIcon } from '@/components/ui/icons';

/**
 * PRF-05 — One-time animated score reveal. If we land here without a `done` analysis
 * (e.g. user typed the URL early), we fall back to the profile overview.
 */
export default function ScoreRevealPage() {
  const overview = useProfileOverview();

  if (overview.isLoading) {
    return (
      <AppShell title="Score reveal" subtitle="">
        <div className="flex items-center gap-2 text-[14px] text-gray-500">
          <SpinnerIcon className="animate-spin" /> Loading…
        </div>
      </AppShell>
    );
  }

  if (!overview.data || overview.data.cvScore === null) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <AppShell title="Score reveal" subtitle="">
      <ScoreReveal overview={overview.data} />
    </AppShell>
  );
}
