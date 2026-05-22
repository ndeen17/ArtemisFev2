import { Link } from 'react-router-dom';
import type { ProfileOverview } from '@artemis/shared';
import { Button } from '@/components/ui/Button';
import {
  SparklesIcon,
  LinkedInIcon,
  ArrowRightIcon,
  SpinnerIcon,
  LockIcon,
} from '@/components/ui/icons';
import { useRefreshAnalysis } from '@/hooks/useAnalysis';

/**
 * PRF-01 — Profile overview header card.
 *
 * Shows the CV score (live), the LinkedIn placeholder ("Coming soon" — never wired
 * at this phase), and a "Re-analyse" button that re-queues the latest CV. Renders
 * a "based on CV only" microcopy line so users understand the readiness blend.
 */
interface Props {
  overview: ProfileOverview | undefined;
  isLoading: boolean;
}

export function ProfileOverviewCard({ overview, isLoading }: Props) {
  const refresh = useRefreshAnalysis();

  if (isLoading || !overview) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-[14px] text-gray-500">
          <SpinnerIcon className="animate-spin" /> Loading resume…
        </div>
      </Card>
    );
  }

  const analysing = overview.analysisStatus === 'queued' || overview.analysisStatus === 'running';

  return (
    <Card>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
            Resume readiness
          </div>
          <h2 className="mt-1 text-[24px] sm:text-[28px] font-extrabold tracking-tight text-[#111827] leading-[1.15]">
            {overview.readinessScore !== null ? `${overview.readinessScore}/100` : 'No score yet'}
          </h2>
          <p className="mt-1 text-[13px] text-gray-500">
            Based on your CV only.{' '}
            <span className="text-gray-400">LinkedIn signals will fold in when it ships.</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending || !overview.hasCv || analysing}
          >
            {refresh.isPending || analysing ? 'Re-analysing…' : 'Re-analyse'}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ScoreSourceTile
          label="CV score"
          score={overview.cvScore}
          delta={overview.weeklyDelta}
          icon={<SparklesIcon className="text-[#15803d]" />}
          accent="bg-[#dcfce7]"
          status={overview.analysisStatus}
        />
        <Link
          to="/profile/linkedin"
          className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-[#fafafa] p-5 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 inline-flex items-center justify-center">
              <LinkedInIcon />
            </div>
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                LinkedIn score
              </div>
              <div className="mt-0.5 text-[18px] font-semibold text-[#111827]">Not connected</div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            <LockIcon className="w-3 h-3" /> Soon
          </span>
        </Link>
      </div>

      {overview.hasCv && overview.analysisStatus === 'done' && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/profile/cv"
            className="inline-flex items-center gap-1 text-[14px] font-semibold text-[#15803d] hover:underline"
          >
            See full CV analysis <ArrowRightIcon className="w-4 h-4" />
          </Link>
          <Link
            to="/profile/action-plan"
            className="inline-flex items-center gap-1 text-[14px] font-semibold text-[#15803d] hover:underline"
          >
            Open action plan <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      )}
    </Card>
  );
}

function ScoreSourceTile({
  label,
  score,
  delta,
  icon,
  accent,
  status,
}: {
  label: string;
  score: number | null;
  delta: number | null;
  icon: React.ReactNode;
  accent: string;
  status: ProfileOverview['analysisStatus'];
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${accent} inline-flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-gray-500">
            {label}
          </div>
          <div className="mt-0.5 text-[18px] font-semibold text-[#111827]">
            {score !== null
              ? `${score}/100`
              : status === 'queued' || status === 'running'
                ? 'Analysing…'
                : status === 'failed'
                  ? 'Failed'
                  : '—'}
          </div>
        </div>
      </div>
      {delta !== null && score !== null && (
        <div
          className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold ${
            delta > 0
              ? 'bg-[#dcfce7] text-[#15803d]'
              : delta < 0
                ? 'bg-rose-50 text-rose-600'
                : 'bg-gray-100 text-gray-500'
          }`}
        >
          {delta > 0 ? `+${delta}` : delta} since last analysis
        </div>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8">
      {children}
    </section>
  );
}
