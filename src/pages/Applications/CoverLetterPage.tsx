import { Link, useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ArrowLeftIcon } from '@/components/ui/icons';
import { CoverLetterEditor } from '@/components/applications/CoverLetterEditor';
import { AtsScoreCard } from '@/components/applications/AtsScoreCard';
import { useApplication, useDraftCoverLetter, useEditCoverLetter } from '@/hooks/useApplications';

/**
 * APP-04 — Cover letter draft + editor. Re-drafting never overwrites a manual
 * edit silently; the textarea is replaced only when the server returns a fresh
 * draft via the mutation.
 */
export default function CoverLetterPage() {
  const { id = '' } = useParams<{ id: string }>();
  const query = useApplication(id);
  const draft = useDraftCoverLetter(id);
  const edit = useEditCoverLetter(id);
  const app = query.data;

  return (
    <AppShell title="Cover letter" subtitle={app?.jobTitle}>
      <Link
        to={`/applications/${id}`}
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-gray-600 hover:text-[#15803d]"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to application
      </Link>

      {(draft.isError || edit.isError) && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[13px] text-rose-700">
          Something went wrong. Make sure you have a CV uploaded on the Profile page, then try
          again.
        </div>
      )}

      <CoverLetterEditor
        letter={app?.coverLetter ?? null}
        onDraft={async (input) => {
          await draft.mutateAsync(input);
        }}
        onSave={async (text) => {
          await edit.mutateAsync({ text });
        }}
        isDrafting={draft.isPending}
        isSaving={edit.isPending}
      />
      <AtsScoreCard score={app?.coverLetter?.atsScore ?? null} variant="cover-letter" />
    </AppShell>
  );
}
