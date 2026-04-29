import { Link } from 'react-router-dom';
import {
  INTERVIEW_TYPE_LABELS,
  type InterviewSession,
} from '@artemis/shared';
import { Button } from '@/components/ui/Button';

interface InterviewDebriefViewProps {
  interview: InterviewSession;
}

/**
 * Phase 8B — Debrief screen. Shown when status='completed' (with debrief)
 * or status='abandoned' (no debrief).
 */
export function InterviewDebriefView({ interview }: InterviewDebriefViewProps) {
  if (interview.status === 'abandoned' || !interview.debrief) {
    return <AbandonedView />;
  }

  const debrief = interview.debrief;
  const overall = debrief.overallScore;

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">
            {INTERVIEW_TYPE_LABELS[interview.type]} · debrief
          </p>
          <h2 className="mt-1 text-[22px] font-semibold text-[#111827]">Your interview score</h2>
        </div>
        <div className="text-right">
          <div className="text-[44px] font-bold leading-none text-[#15803d]">{overall}</div>
          <div className="text-[11px] uppercase tracking-wide text-gray-400">/ 100</div>
        </div>
      </header>

      <section className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
        <h3 className="text-[14px] font-semibold text-[#111827]">By criterion</h3>
        <div className="mt-4 space-y-4">
          {debrief.criterionScores.map((c) => (
            <div key={c.key}>
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-semibold text-[#111827]">{c.label}</span>
                <span className="text-gray-500">{c.score}/100</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-[#15803d]"
                  style={{ width: `${Math.min(100, Math.max(0, c.score))}%` }}
                />
              </div>
              <p className="mt-1.5 text-[12px] text-gray-600 leading-relaxed">{c.rationale}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-3xl border border-gray-100 bg-white p-6">
          <h3 className="text-[14px] font-semibold text-[#15803d]">Strengths</h3>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            {debrief.strengths.map((s, i) => (
              <li key={i} className="text-[13px] text-gray-700 leading-relaxed">
                {s}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-3xl border border-gray-100 bg-white p-6">
          <h3 className="text-[14px] font-semibold text-rose-600">Things to improve</h3>
          <ul className="mt-3 space-y-2 list-disc pl-5">
            {debrief.weaknesses.map((s, i) => (
              <li key={i} className="text-[13px] text-gray-700 leading-relaxed">
                {s}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
        <h3 className="text-[14px] font-semibold text-[#111827]">Next steps</h3>
        <ul className="mt-3 space-y-3">
          {debrief.nextActions.map((a, i) => (
            <li key={i} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-[13px] font-semibold text-[#111827]">{a.title}</p>
              <p className="mt-1 text-[12px] text-gray-700 leading-relaxed">{a.detail}</p>
              {a.link && (
                <a
                  href={a.link}
                  className="mt-2 inline-block text-[12px] font-semibold text-[#15803d] hover:underline"
                >
                  Open →
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>

      {interview.transcript.length > 0 && (
        <details className="rounded-3xl border border-gray-100 bg-white p-6">
          <summary className="cursor-pointer text-[13px] font-semibold text-[#111827]">
            View full transcript
          </summary>
          <div className="mt-4 space-y-3">
            {interview.transcript.map((t, i) => (
              <div key={i} className="text-[13px]">
                <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400">
                  {t.role === 'interviewer' ? 'Interviewer' : 'You'}
                </p>
                <p className="mt-0.5 whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {t.text}
                </p>
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="flex flex-wrap gap-3">
        <Button href="/interviews/new">Start another interview</Button>
        <Button variant="ghost" href="/interviews">
          Back to history
        </Button>
      </div>
    </div>
  );
}

function AbandonedView() {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center">
      <h2 className="text-[18px] font-semibold text-[#111827]">Interview ended early</h2>
      <p className="mt-2 text-[13px] text-gray-500 max-w-md mx-auto">
        You ended this session before answering enough questions to score it. Start a new one when
        you&apos;re ready — at least three answers are needed for a debrief.
      </p>
      <div className="mt-5 flex justify-center gap-3">
        <Button href="/interviews/new">Start a new interview</Button>
        <Link
          to="/interviews"
          className="inline-flex items-center text-[13px] font-semibold text-gray-600 hover:text-[#15803d] px-3 py-2"
        >
          Back to history
        </Link>
      </div>
    </div>
  );
}
