import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { ArrowLeftIcon } from '@/components/ui/icons';
import { useApplication, useUpdateApplication } from '@/hooks/useApplications';

/**
 * APP-02 — JD edit page. Lets the user view/edit the saved job description
 * before tailoring the CV.
 */
export default function JdTargetPage() {
  const { id = '' } = useParams<{ id: string }>();
  const query = useApplication(id);
  const update = useUpdateApplication(id);
  const [jdText, setJdText] = useState('');

  useEffect(() => {
    if (query.data) setJdText(query.data.jdText);
  }, [query.data]);

  const dirty = query.data && jdText.trim() !== query.data.jdText;
  const tooShort = jdText.trim().length < 20;

  return (
    <AppShell title="Job description" subtitle={query.data?.jobTitle}>
      <Link
        to={`/applications/${id}`}
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-gray-600 hover:text-[#15803d]"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to application
      </Link>

      <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
        <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
          Job description
        </div>
        <h2 className="mt-1 text-[20px] font-semibold text-[#111827]">Refine the JD</h2>
        <p className="mt-1 text-[13px] text-gray-500">
          Edits here are saved against this application and used by the CV tailor + cover-letter
          drafter.
        </p>

        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          rows={20}
          className="mt-5 w-full rounded-2xl border border-gray-200 p-4 text-[14px] leading-relaxed font-sans text-gray-800"
        />
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[12px] text-gray-400">
            {jdText.trim().length} chars {tooShort && '· min 20'}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => update.mutate({ jdText: jdText.trim() })}
              disabled={!dirty || tooShort || update.isPending}
            >
              {update.isPending ? 'Saving…' : 'Save JD'}
            </Button>
            <Button href={`/applications/${id}/cv-review`} variant="outline">
              Continue to CV →
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
