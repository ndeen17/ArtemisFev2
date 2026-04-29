import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { InterviewSession, TranscriptTurn } from '@artemis/shared';
import { Button } from '@/components/ui/Button';
import { useEndInterview } from '@/hooks/useInterviews';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/cn';
import {
  createRealtimeClient,
  type RealtimeClient,
  type RealtimeServerFrame,
  type RealtimeStatus,
} from '@/features/interviews/realtime';

interface InterviewVoiceChatProps {
  interview: InterviewSession;
}

interface LiveCaption {
  role: 'interviewer' | 'candidate';
  text: string;
  final: boolean;
  ts: number;
}

const STATUS_COPY: Record<RealtimeStatus, string> = {
  idle: 'Ready',
  awaiting_mic: 'Asking for microphone…',
  connecting: 'Connecting…',
  live: 'Live',
  reconnecting: 'Reconnecting…',
  closing: 'Ending…',
  closed: 'Disconnected',
  error: 'Error',
};

const CLOSE_CODE_MESSAGES: Record<number, string> = {
  4001: 'Microphone access was denied. Allow it and try again.',
  4002: 'Could not initialise audio. Please reload the page.',
  4003: 'Could not open the realtime channel.',
  4400: 'Bad request — this session may be invalid.',
  4401: 'Your session expired. Sign in again.',
  4403: 'This session is not in voice mode or is no longer active.',
  4404: 'Interview not found.',
  4429: 'You have used today\u2019s 60 minutes of voice practice.',
  4500: 'Realtime service failed. Please try again.',
  4503: 'Voice service is not configured on the server.',
};

export function InterviewVoiceChat({ interview }: InterviewVoiceChatProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const end = useEndInterview(interview.id);
  const qc = useQueryClient();
  const clientRef = useRef<RealtimeClient | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>('idle');
  const [muted, setMuted] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [captions, setCaptions] = useState<LiveCaption[]>([]);
  const [quotaRemainingSec, setQuotaRemainingSec] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [closeInfo, setCloseInfo] = useState<{ code: number; reason: string } | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [reconnectInfo, setReconnectInfo] = useState<{ attempt: number; nextDelayMs: number } | null>(null);
  const [micDenied, setMicDenied] = useState(false);

  const persistedTurns = interview.transcript;

  const handleFrame = useCallback((frame: RealtimeServerFrame) => {
    if (frame.type === 'ready') {
      setQuotaRemainingSec(frame.quota.remainingSec);
      return;
    }
    if (frame.type === 'transcript') {
      setCaptions((prev) => {
        const next = [...prev];
        // Replace trailing partial of same role; otherwise append.
        const last = next[next.length - 1];
        if (last && last.role === frame.role && !last.final) {
          next[next.length - 1] = {
            role: frame.role,
            text: frame.text,
            final: frame.final,
            ts: Date.now(),
          };
        } else {
          next.push({
            role: frame.role,
            text: frame.text,
            final: frame.final,
            ts: Date.now(),
          });
        }
        return next.slice(-50);
      });
      return;
    }
    if (frame.type === 'cap_exceeded') {
      setErrorMessage('You have used today\u2019s 60 minutes of voice practice.');
      return;
    }
    if (frame.type === 'error') {
      setErrorMessage(frame.message ?? 'Realtime error.');
    }
  }, []);

  const handleClose = useCallback(
    (info: { code: number; reason: string }) => {
      setCloseInfo(info);
      if (info.code === 4001) setMicDenied(true);
      const m = CLOSE_CODE_MESSAGES[info.code];
      if (m && !errorMessage) setErrorMessage(m);
      // Refresh the session — server will have flipped to scoring/completed.
      void qc.invalidateQueries({ queryKey: ['interview', interview.id] });
      void qc.invalidateQueries({ queryKey: ['interviews'] });
      void qc.invalidateQueries({ queryKey: ['interviews', 'voiceQuota'] });
    },
    [qc, interview.id, errorMessage],
  );

  const handleStart = useCallback(async () => {
    if (!accessToken) {
      setErrorMessage('You are not signed in.');
      return;
    }
    if (clientRef.current) return;
    setErrorMessage(null);
    setCloseInfo(null);
    setMicDenied(false);
    setReconnectInfo(null);
    setHasStarted(true);
    const client = createRealtimeClient({
      interviewId: interview.id,
      accessToken,
      handlers: {
        onStatus: (s) => {
          setStatus(s);
          if (s === 'live') setReconnectInfo(null);
        },
        onFrame: handleFrame,
        onMicLevel: setMicLevel,
        onClose: handleClose,
        onReconnect: (attempt, nextDelayMs) => setReconnectInfo({ attempt, nextDelayMs }),
      },
    });
    clientRef.current = client;
    await client.start();
  }, [accessToken, interview.id, handleFrame, handleClose]);

  const handleEnd = useCallback(async () => {
    clientRef.current?.end();
    try {
      await end.mutateAsync({ reason: 'user_ended' });
    } catch {
      /* server may have already ended via the WS close */
    }
  }, [end]);

  const handleMute = useCallback(() => {
    const next = clientRef.current?.toggleMute();
    if (typeof next === 'boolean') setMuted(next);
  }, []);

  const handleCancel = useCallback(() => {
    clientRef.current?.cancel();
  }, []);

  useEffect(() => {
    return () => {
      clientRef.current?.close();
      clientRef.current = null;
    };
  }, []);

  // Phase 8E — close gracefully if the user navigates away or closes the tab.
  useEffect(() => {
    const handler = (): void => {
      clientRef.current?.end();
      clientRef.current?.close();
    };
    window.addEventListener('beforeunload', handler);
    window.addEventListener('pagehide', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
      window.removeEventListener('pagehide', handler);
    };
  }, []);

  const minutesRemaining = useMemo(() => {
    if (quotaRemainingSec == null) return null;
    return Math.max(0, Math.floor(quotaRemainingSec / 60));
  }, [quotaRemainingSec]);

  const isLive = status === 'live';
  const isFinished = status === 'closed' || status === 'error';

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[480px] rounded-3xl border border-gray-100 bg-white overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-block h-2 w-2 rounded-full',
              isLive ? 'bg-[#15803d] animate-pulse' : 'bg-gray-300',
            )}
          />
          <span className="text-[12px] font-semibold text-[#111827]">
            Voice interview · {STATUS_COPY[status]}
          </span>
          {minutesRemaining != null && (
            <span className="text-[11px] text-gray-500">· {minutesRemaining} min left today</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasStarted && !isFinished && (
            <>
              <Button variant="outline" size="sm" onClick={handleMute}>
                {muted ? 'Unmute' : 'Mute'}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancel} disabled={!isLive}>
                Interrupt
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnd}
            disabled={end.isPending || (!hasStarted && !isFinished)}
          >
            {end.isPending ? 'Ending…' : 'End & score'}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
        {!hasStarted && (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
            <p className="text-[14px] font-semibold text-[#111827]">Ready to start</p>
            <p className="mt-1 text-[12px] text-gray-600">
              We&apos;ll ask for microphone access, then the interviewer will speak the first
              question.
            </p>
            <div className="mt-4">
              <Button onClick={handleStart}>Start voice interview</Button>
            </div>
          </div>
        )}

        {micDenied && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-900">
            <p className="font-semibold">Microphone access was blocked.</p>
            <p className="mt-1 text-[12px]">
              Allow microphone access in your browser&apos;s site settings, then click &ldquo;Try
              again&rdquo;.
            </p>
            <div className="mt-3">
              <Button
                size="sm"
                onClick={() => {
                  clientRef.current = null;
                  setMicDenied(false);
                  setHasStarted(false);
                  setStatus('idle');
                  setCloseInfo(null);
                  setErrorMessage(null);
                  void handleStart();
                }}
              >
                Try again
              </Button>
            </div>
          </div>
        )}

        {reconnectInfo && status === 'reconnecting' && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-2 text-[12px] text-amber-900">
            Connection lost. Reconnecting (attempt {reconnectInfo.attempt}…)
          </div>
        )}

        {persistedTurns.length > 0 && (
          <section className="space-y-3">
            <p className="text-[10px] uppercase tracking-wide text-gray-400">Earlier in this session</p>
            {persistedTurns.map((turn, i) => (
              <TurnBubble key={`p-${i}`} turn={turn} />
            ))}
          </section>
        )}

        {captions.length > 0 && (
          <section className="space-y-3">
            <p className="text-[10px] uppercase tracking-wide text-gray-400">Live</p>
            {captions.map((c, i) => (
              <CaptionBubble key={`c-${c.ts}-${i}`} caption={c} />
            ))}
          </section>
        )}

        {hasStarted && captions.length === 0 && persistedTurns.length === 0 && isLive && (
          <p className="text-center text-[13px] text-gray-400">
            Waiting for the first question…
          </p>
        )}
      </div>

      <footer className="border-t border-gray-100 bg-white px-4 sm:px-6 py-3 space-y-2">
        {errorMessage && <p className="text-[12px] text-rose-600">{errorMessage}</p>}
        {closeInfo && !errorMessage && status !== 'live' && (
          <p className="text-[12px] text-gray-500">
            Disconnected (code {closeInfo.code}).
          </p>
        )}
        <div className="flex items-center gap-3">
          <MicMeter level={muted ? 0 : micLevel} active={isLive && !muted} />
          <span className="text-[11px] text-gray-400">
            {muted
              ? 'Microphone muted'
              : isLive
                ? 'Listening — speak naturally, the interviewer will respond.'
                : 'Microphone idle'}
          </span>
        </div>
      </footer>
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

function CaptionBubble({ caption }: { caption: LiveCaption }) {
  const isInterviewer = caption.role === 'interviewer';
  return (
    <div className={cn('flex', isInterviewer ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap',
          isInterviewer
            ? 'bg-gray-50 text-[#111827] border border-gray-100'
            : 'bg-[#dcfce7] text-[#14532d]',
          !caption.final && 'opacity-70 italic',
        )}
      >
        <p className="text-[10px] uppercase tracking-wide opacity-60 mb-1">
          {isInterviewer ? 'Interviewer' : 'You'}
          {!caption.final && ' · …'}
        </p>
        {caption.text || (isInterviewer ? '…' : '')}
      </div>
    </div>
  );
}

function MicMeter({ level, active }: { level: number; active: boolean }) {
  const pct = Math.min(100, Math.round(level * 200));
  return (
    <div
      className={cn(
        'h-2 w-32 overflow-hidden rounded-full bg-gray-100',
        !active && 'opacity-50',
      )}
    >
      <div
        className="h-full bg-[#15803d] transition-[width] duration-75"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
