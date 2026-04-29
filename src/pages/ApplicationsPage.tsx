import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { KANBAN_COLUMNS, STATUS_LABELS, type ApplicationStatus } from '@artemis/shared';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { PlusIcon, BriefcaseIcon } from '@/components/ui/icons';
import { KanbanBoard } from '@/components/applications/KanbanBoard';
import { useApplications } from '@/hooks/useApplications';
import { cn } from '@/lib/cn';

/**
 * APP-01 — Applications hub. Kanban view across all six statuses with an
 * optional status filter pill bar. "+ New" routes to /applications/new.
 */
export default function ApplicationsPage() {
  const [filter, setFilter] = useState<ApplicationStatus | null>(null);
  const query = useApplications();
  const items = useMemo(() => query.data ?? [], [query.data]);

  const visible = useMemo(
    () => (filter ? items.filter((i) => i.status === filter) : items),
    [items, filter],
  );

  return (
    <AppShell title="Applications" subtitle="Track every role you target">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterPill active={filter === null} onClick={() => setFilter(null)}>
            All ({items.length})
          </FilterPill>
          {KANBAN_COLUMNS.map((s) => {
            const count = items.filter((i) => i.status === s).length;
            return (
              <FilterPill key={s} active={filter === s} onClick={() => setFilter(s)}>
                {STATUS_LABELS[s]} ({count})
              </FilterPill>
            );
          })}
        </div>
        <Button href="/applications/new">
          <PlusIcon className="w-4 h-4" /> New application
        </Button>
      </div>

      {query.isLoading ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-[14px] text-gray-500">
          Loading…
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <KanbanBoard items={visible} />
      )}
    </AppShell>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-[12px] font-semibold border transition',
        active
          ? 'bg-[#111827] text-white border-[#111827]'
          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
      )}
    >
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
        <BriefcaseIcon className="w-6 h-6" />
      </div>
      <h2 className="mt-4 text-[18px] font-semibold text-[#111827]">No applications yet</h2>
      <p className="mt-1 text-[13px] text-gray-500">
        Save a role to start tailoring your CV and drafting a cover letter.
      </p>
      <div className="mt-5">
        <Link
          to="/applications/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] text-[#15803d] px-4 py-2 text-[13px] font-semibold hover:bg-[#bbf7d0]"
        >
          <PlusIcon className="w-4 h-4" /> Add your first application
        </Link>
      </div>
    </div>
  );
}
