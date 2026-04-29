import { Link } from 'react-router-dom';
import {
  INTERVIEW_TYPE_LABELS,
  type InterviewSessionSummary,
} from '@artemis/shared';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { PlusIcon, MicIcon } from '@/components/ui/icons';
import { useInterviews } from '@/hooks/useInterviews';
import { cn } from '@/lib/cn';

/**
 * Phase 8B — Interviews hub. Lists past sessions and offers a "+ New" entry.
 * Sessions in `briefed`/`live` get a "Resume" CTA; `completed` show their score.
 */
export default function InterviewsPage() {
  const query = useInterviews();
  const items = query.data ?? [];

  return (
    <AppShell title="Interviews" subtitle="Practice that actually feels real">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-[13px] text-gray-500">
          {items.length === 0
            ? 'No interviews yet.'
            : `${items.length} session${items.length === 1 ? '' : 's'}`}
        </p>
        <Button href="/interviews/new">
          <PlusIcon className="w-4 h-4" /> New interview
        </Button>
      </div>

      {query.isLoading ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-[14px] text-gray-500">
          Loading…
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <SessionRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

const STATUS_BADGE: Record<InterviewSessionSummary['status'], { label: string; cls: string }> = {
  configuring: { label: 'Drafting', cls: 'bg-gray-100 text-gray-600' },
  briefed: { label: 'Ready', cls: 'bg-amber-50 text-amber-700' },
  live: { label: 'Live', cls: 'bg-emerald-50 text-emerald-700' },
  scoring: { label: 'Scoring', cls: 'bg-blue-50 text-blue-700' },
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700' },
  interrupted: { label: 'Interrupted', cls: 'bg-rose-50 text-rose-700' },
  abandoned: { label: 'Abandoned', cls: 'bg-gray-100 text-gray-500' },
};

function SessionRow({ item }: { item: InterviewSessionSummary }) {
  const badge = STATUS_BADGE[item.status];
  const isResumable = item.status === 'briefed' || item.status === 'live';
  return (
    <Link
      to={`/interviews/${item.id}`}
      className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 hover:border-gray-300 transition"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[14px] font-semibold text-[#111827] truncate">
            {INTERVIEW_TYPE_LABELS[item.type]}
          </p>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              badge.cls,
            )}
          >
            {badge.label}
          </span>
        </div>
        <p className="mt-0.5 text-[12px] text-gray-500">
          {new Date(item.createdAt).toLocaleString()}
          {item.durationSec !== null && ` · ${Math.round(item.durationSec / 60)} min`}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {item.overallScore !== null ? (
          <div className="text-right">
            <div className="text-[20px] font-bold text-[#15803d] leading-none">
              {item.overallScore}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-gray-400">/100</div>
          </div>
        ) : isResumable ? (
          <span className="text-[12px] font-semibold text-[#15803d]">Resume →</span>
        ) : (
          <span className="text-[12px] text-gray-400">—</span>
        )}
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
        <MicIcon className="w-6 h-6" />
      </div>
      <h2 className="mt-4 text-[18px] font-semibold text-[#111827]">No interviews yet</h2>
      <p className="mt-1 text-[13px] text-gray-500 max-w-md mx-auto">
        Run a mock interview to get a structured debrief on your structure, ownership and impact.
      </p>
      <div className="mt-5">
        <Link
          to="/interviews/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] text-[#15803d] px-4 py-2 text-[13px] font-semibold hover:bg-[#bbf7d0]"
        >
          <PlusIcon className="w-4 h-4" /> Start your first interview
        </Link>
      </div>
    </div>
  );
}
