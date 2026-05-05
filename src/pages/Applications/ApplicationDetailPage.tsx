import { Link, useNavigate, useParams } from 'react-router-dom';
import { STATUS_LABELS } from '@artemis/shared';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { ArrowLeftIcon, ArrowRightIcon, SparklesIcon, TrashIcon } from '@/components/ui/icons';
import { StatusPicker } from '@/components/applications/StatusPicker';
import { OutcomePrompt } from '@/components/applications/OutcomePrompt';
import {
  useApplication,
  useDeleteApplication,
  useSetApplicationStatus,
} from '@/hooks/useApplications';

export default function ApplicationDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const query = useApplication(id);
  const setStatus = useSetApplicationStatus(id);
  const remove = useDeleteApplication();
  const app = query.data;

  async function handleDelete() {
    if (!app) return;
    if (!confirm(`Delete "${app.jobTitle}" at ${app.company}?`)) return;
    await remove.mutateAsync(app.id);
    navigate('/applications');
  }

  return (
    <AppShell title={app?.jobTitle ?? 'Application'} subtitle={app?.company}>
      <Link
        to="/applications"
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-gray-600 hover:text-[#15803d]"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to applications
      </Link>

      {query.isLoading && (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-[14px] text-gray-500">
          Loading…
        </div>
      )}

      {app && (
        <>
          <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
                  {STATUS_LABELS[app.status]}
                </div>
                <h1 className="mt-1 text-[24px] font-semibold text-[#111827]">{app.jobTitle}</h1>
                <p className="text-[14px] text-gray-500">{app.company}</p>
              </div>
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-semibold text-rose-600 hover:bg-rose-50"
              >
                <TrashIcon className="w-4 h-4" /> Delete
              </button>
            </div>
            <div className="mt-5">
              <span className="text-[12px] font-semibold text-gray-600">Status</span>
              <div className="mt-2">
                <StatusPicker
                  value={app.status}
                  onChange={(s) => setStatus.mutate(s)}
                  disabled={setStatus.isPending}
                />
              </div>
            </div>
          </div>

          <OutcomePrompt app={app} />

          <div className="grid gap-4 sm:grid-cols-3">
            <ActionTile
              title="Job description"
              body="Review the JD you saved."
              to={`/applications/${app.id}/jd`}
              cta="Open JD"
            />
            <ActionTile
              title="Targeted CV"
              body={
                app.targetedCv
                  ? 'View the diff vs. your base CV.'
                  : 'Generate a tailored CV from the JD.'
              }
              to={`/applications/${app.id}/cv-review`}
              cta={app.targetedCv ? 'View diff' : 'Tailor CV'}
              icon={<SparklesIcon className="w-4 h-4" />}
            />
            <ActionTile
              title="Cover letter"
              body={app.coverLetter ? 'Edit your draft.' : 'Draft a cover letter with AI.'}
              to={`/applications/${app.id}/cover-letter`}
              cta={app.coverLetter ? 'Edit letter' : 'Draft letter'}
              icon={<SparklesIcon className="w-4 h-4" />}
            />
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
            <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
              Timeline
            </div>
            <h2 className="mt-1 text-[18px] font-semibold text-[#111827]">Status history</h2>
            <ul className="mt-4 space-y-2">
              {app.statusHistory.map((entry, i) => (
                <li key={i} className="flex items-center justify-between text-[13px] text-gray-700">
                  <span className="font-semibold">{STATUS_LABELS[entry.status]}</span>
                  <span className="text-gray-400">{new Date(entry.at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </AppShell>
  );
}

function ActionTile({
  title,
  body,
  to,
  cta,
  icon,
}: {
  title: string;
  body: string;
  to: string;
  cta: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 flex flex-col">
      <div className="text-[14px] font-semibold text-[#111827]">{title}</div>
      <p className="mt-1 text-[13px] text-gray-500 flex-1">{body}</p>
      <div className="mt-4">
        <Button href={to} variant="outline">
          {icon}
          {cta} <ArrowRightIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
