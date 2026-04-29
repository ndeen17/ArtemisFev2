import { Link } from 'react-router-dom';
import {
  KANBAN_COLUMNS,
  STATUS_LABELS,
  type ApplicationStatus,
  type ApplicationSummary,
} from '@artemis/shared';
import { cn } from '@/lib/cn';

const STATUS_TONE: Record<ApplicationStatus, string> = {
  saved: 'bg-gray-100 text-gray-700',
  applied: 'bg-blue-50 text-blue-700',
  interview: 'bg-amber-50 text-amber-700',
  offer: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
  withdrawn: 'bg-gray-100 text-gray-500',
};

function ApplicationCard({ app }: { app: ApplicationSummary }) {
  return (
    <Link
      to={`/applications/${app.id}`}
      className="block rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-md transition"
    >
      <div className="text-[14px] font-semibold text-[#111827] leading-snug line-clamp-2">
        {app.jobTitle}
      </div>
      <div className="text-[12px] text-gray-500 mt-0.5">{app.company}</div>
      <div className="mt-3 flex items-center gap-1.5 flex-wrap">
        {app.hasTargetedCv && (
          <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold">
            CV
          </span>
        )}
        {app.hasCoverLetter && (
          <span className="inline-flex items-center rounded-full bg-violet-50 text-violet-700 px-2 py-0.5 text-[10px] font-semibold">
            Letter
          </span>
        )}
        <span className="ml-auto text-[10px] text-gray-400">
          {new Date(app.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </Link>
  );
}

interface KanbanBoardProps {
  items: ApplicationSummary[];
}

export function KanbanBoard({ items }: KanbanBoardProps) {
  const grouped = KANBAN_COLUMNS.map((status) => ({
    status,
    items: items.filter((i) => i.status === status),
  }));
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {grouped.map((col) => (
        <div key={col.status} className="rounded-3xl bg-[#f5f5f4] border border-gray-100 p-3">
          <div className="flex items-center justify-between mb-3 px-1">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                STATUS_TONE[col.status],
              )}
            >
              {STATUS_LABELS[col.status]}
            </span>
            <span className="text-[11px] font-semibold text-gray-400">{col.items.length}</span>
          </div>
          <div className="space-y-2 min-h-[80px]">
            {col.items.length === 0 ? (
              <div className="text-[11px] text-gray-400 px-1 py-3">No applications</div>
            ) : (
              col.items.map((app) => <ApplicationCard key={app.id} app={app} />)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
