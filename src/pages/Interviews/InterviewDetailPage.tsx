import { Link, useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ArrowLeftIcon } from '@/components/ui/icons';
import { useInterview } from '@/hooks/useInterviews';
import { InterviewBriefCard } from '@/components/interviews/InterviewBriefCard';
import { InterviewChat } from '@/components/interviews/InterviewChat';
import { InterviewVoiceChat } from '@/components/interviews/InterviewVoiceChat';
import { InterviewDebriefView } from '@/components/interviews/InterviewDebriefView';

/**
 * Phase 8B — Single router-by-status page. Picks the right view based on the
 * session's current state.
 *
 *   briefed + transcript empty → BriefCard ("Start" → /open → live)
 *   live | (briefed + transcript non-empty) → Chat
 *   scoring → spinner (BE is generating debrief inline)
 *   completed | abandoned → DebriefView
 *   interrupted → DebriefView (8E will treat this the same as completed/abandoned)
 *   configuring → spinner (transient — BE moves to briefed before responding)
 */
export default function InterviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useInterview(id);

  if (!id) return null;

  return (
    <AppShell title="Interview" subtitle="Mock interview practice">
      <Link
        to="/interviews"
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-gray-600 hover:text-[#15803d]"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to interviews
      </Link>

      {query.isLoading && (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-[14px] text-gray-500">
          Loading…
        </div>
      )}

      {query.isError && (
        <div className="rounded-3xl border border-rose-100 bg-rose-50 p-8 text-center text-[14px] text-rose-700">
          Could not load this interview.
        </div>
      )}

      {query.data &&
        (() => {
          const interview = query.data;
          const status = interview.status;
          const transcriptEmpty = interview.transcript.length === 0;

          if (status === 'configuring' || status === 'scoring') {
            return (
              <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-[14px] text-gray-500">
                {status === 'scoring' ? 'Scoring your interview…' : 'Preparing your brief…'}
              </div>
            );
          }
          if (status === 'briefed' && transcriptEmpty) {
            return <InterviewBriefCard interview={interview} />;
          }
          if (status === 'live' || (status === 'briefed' && !transcriptEmpty)) {
            return interview.mode === 'voice' ? (
              <InterviewVoiceChat interview={interview} />
            ) : (
              <InterviewChat interview={interview} />
            );
          }
          // completed | abandoned | interrupted
          return <InterviewDebriefView interview={interview} />;
        })()}
    </AppShell>
  );
}
