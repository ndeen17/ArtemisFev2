import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { InterviewSession, TranscriptTurn } from '@artemis/shared';
import { Button } from '@/components/ui/Button';
import { useEndInterview, usePostTurn } from '@/hooks/useInterviews';
import { cn } from '@/lib/cn';

interface InterviewChatProps {
  interview: InterviewSession;
}

const MAX_TURNS_BEFORE_FORCED_END = 24;

/**
 * Phase 8B — Text-mode chat. Posts candidate turns and renders the rolling
 * interviewer/candidate transcript. "End interview" triggers scoring server-side.
 */
export function InterviewChat({ interview }: InterviewChatProps) {
  const post = usePostTurn(interview.id);
  const end = useEndInterview(interview.id);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const turns = interview.transcript;
  const candidateTurnCount = turns.filter((t) => t.role === 'candidate').length;
  const turnsRemaining = Math.max(0, MAX_TURNS_BEFORE_FORCED_END - turns.length);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns.length]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const value = text.trim();
    if (!value) return;
    try {
      await post.mutateAsync({ text: value });
      setText('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('TURN_CAP')) setError('Turn limit reached. End the session to score it.');
      else setError('Could not send. Try again.');
    }
  }

  async function handleEnd() {
    setError(null);
    try {
      await end.mutateAsync({ reason: 'user_ended' });
    } catch {
      setError('Could not end the interview.');
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[480px] rounded-3xl border border-gray-100 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[#15803d] animate-pulse" />
          <span className="text-[12px] font-semibold text-[#111827]">Live interview</span>
          <span className="text-[11px] text-gray-400">
            · {candidateTurnCount} answered · {turnsRemaining} turns left
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={handleEnd} disabled={end.isPending}>
          {end.isPending ? 'Ending…' : 'End & score'}
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
        {turns.length === 0 ? (
          <p className="text-center text-[13px] text-gray-400">Waiting for the first question…</p>
        ) : (
          turns.map((turn, i) => <TurnBubble key={i} turn={turn} />)
        )}
        {post.isPending && (
          <div className="flex items-center gap-2 text-[12px] text-gray-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-300 animate-bounce" />
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:120ms]" />
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-300 animate-bounce [animation-delay:240ms]" />
            <span>Interviewer is thinking…</span>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-100 bg-white px-4 sm:px-6 py-4 space-y-2"
      >
        {error && <p className="text-[12px] text-rose-600">{error}</p>}
        <div className="flex gap-2 items-end">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void handleSubmit(e as unknown as FormEvent);
              }
            }}
            rows={3}
            disabled={post.isPending || end.isPending || turnsRemaining === 0}
            className="flex-1 rounded-2xl border border-gray-200 px-4 py-2.5 text-[14px] leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#15803d]/30"
            placeholder={
              turnsRemaining === 0 ? 'Turn limit reached — end to score.' : 'Type your answer…'
            }
          />
          <Button
            type="submit"
            disabled={!text.trim() || post.isPending || turnsRemaining === 0}
          >
            Send
          </Button>
        </div>
        <p className="text-[11px] text-gray-400">⌘/Ctrl + Enter to send</p>
      </form>
    </div>
  );
}

function TurnBubble({ turn }: { turn: TranscriptTurn }) {
  const isInterviewer = turn.role === 'interviewer';
  return (
    <div className={cn('flex', isInterviewer ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap',
          isInterviewer
            ? 'bg-gray-50 text-[#111827] border border-gray-100'
            : 'bg-[#dcfce7] text-[#14532d]',
        )}
      >
        <p className="text-[10px] uppercase tracking-wide opacity-60 mb-1">
          {isInterviewer ? 'Interviewer' : 'You'}
        </p>
        {turn.text}
      </div>
    </div>
  );
}
