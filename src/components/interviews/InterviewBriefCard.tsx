import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  INTERVIEW_SOURCE_LABELS,
  INTERVIEW_TYPE_LABELS,
  type InterviewSession,
} from '@artemis/shared';
import { Button } from '@/components/ui/Button';
import { useEndInterview, useOpenInterview, useVoiceQuota } from '@/hooks/useInterviews';

interface InterviewBriefCardProps {
  interview: InterviewSession;
}

/**
 * Phase 8B/8D — Brief screen. Shown when status='briefed' and transcript is empty.
 *
 * Text mode: "Start" calls /open which generates the opening interviewer turn
 * and flips status to 'live'.
 * Voice mode: "Start" optimistically flips the local query cache to 'live' so
 * the detail page swaps to <InterviewVoiceChat>. The WebSocket gateway will
 * then transition the server-side status itself when the connection opens.
 */
export function InterviewBriefCard({ interview }: InterviewBriefCardProps) {
  const open = useOpenInterview(interview.id);
  const end = useEndInterview(interview.id);
  const qc = useQueryClient();
  const isVoice = interview.mode === 'voice';
  const voiceQuota = useVoiceQuota();
  const [error, setError] = useState<string | null>(null);

  const brief = interview.brief;
  if (!brief) return null;

  async function handleStart() {
    setError(null);
    if (isVoice) {
      qc.setQueryData(['interview', interview.id], {
        ...interview,
        status: 'live' as const,
      });
      return;
    }
    try {
      await open.mutateAsync();
    } catch {
      setError('Could not start the interview. Try again.');
    }
  }

  async function handleCancel() {
    setError(null);
    try {
      await end.mutateAsync({ reason: 'user_ended' });
    } catch {
      setError('Could not cancel.');
    }
  }

  const remainingMin =
    isVoice && voiceQuota.data ? Math.floor(voiceQuota.data.remainingSec / 60) : null;
  const voiceBlocked = isVoice && remainingMin === 0;

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#dcfce7] text-[#15803d] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
            {INTERVIEW_TYPE_LABELS[interview.type]}
          </span>
          <span className="text-[12px] text-gray-500">
            {INTERVIEW_SOURCE_LABELS[interview.source]}
          </span>
          <span className="text-[12px] text-gray-400">·</span>
          <span className="text-[12px] text-gray-500">~{brief.expectedDurationMin} min</span>
        </div>
        <h2 className="mt-4 text-[20px] font-semibold text-[#111827]">Your brief</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-gray-700">{brief.summary}</p>
      </header>

      <section className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
        <h3 className="text-[14px] font-semibold text-[#111827]">What you&apos;ll be scored on</h3>
        <ul className="mt-3 space-y-3">
          {brief.criteria.map((c) => (
            <li key={c.key} className="flex gap-3">
              <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-[#15803d]" />
              <div>
                <p className="text-[13px] font-semibold text-[#111827]">{c.label}</p>
                <p className="text-[12px] text-gray-600 leading-relaxed">{c.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
        <h3 className="text-[14px] font-semibold text-[#111827]">Tips before you start</h3>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          {brief.tips.map((t, i) => (
            <li key={i} className="text-[13px] text-gray-700 leading-relaxed">
              {t}
            </li>
          ))}
        </ul>
      </section>

      {error && <p className="text-[13px] text-rose-600">{error}</p>}

      {isVoice && (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-[12px] text-gray-700">
          {remainingMin == null
            ? 'Voice mode: realtime spoken interview. We&apos;ll ask for microphone access when you start.'
            : voiceBlocked
              ? 'You have used today\u2019s 60 minutes of voice practice. Try again tomorrow or switch to text mode.'
              : `Voice mode · ${remainingMin} min left today (60 min/day cap).`}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleStart} disabled={open.isPending || voiceBlocked}>
          {open.isPending
            ? 'Starting…'
            : isVoice
              ? 'Start voice interview'
              : 'Start interview'}
        </Button>
        <Button variant="ghost" onClick={handleCancel} disabled={end.isPending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
