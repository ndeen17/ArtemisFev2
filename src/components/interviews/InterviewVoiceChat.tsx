import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type {
  InterviewSession,
  TranscriptTurn,
  RealtimeVoice,
  RealtimeVadSensitivity,
} from '@artemis/shared';
import { Button } from '@/components/ui/Button';
import { useEndInterview } from '@/hooks/useInterviews';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/cn';
import {
  createRealtimeClient,
  type RealtimeClient,
  type RealtimeServerFrame,
  type RealtimeStatus,
  REALTIME_CLOSE_MESSAGES,
} from '@/features/interviews/realtimeWebRTC';
import { useAudioIntensity } from '@/components/interviews/useAudioIntensity';
import { readVoiceSettings } from '@/features/interviews/voiceSettings';

/**
 * Phase 8G — Voice interview UI.
 *
 * Upper zone (60%): floating audio-reactive 3D blob (Norah's avatar) with a
 * status pill, mic toggle, interrupt, and end-and-score controls.
 * Lower zone (40%): two-column transcript — Norah on the left (emerald),
 * candidate on the right (slate). Auto-scrolls; live partial captions render
 * with a thin pulsing dot to indicate they're still streaming.
 *
 * The blob component is `React.lazy`'d so non-voice routes don't pay for the
 * react-three-fiber bundle (~150KB gz).
 */
const VoiceBlob = lazy(() =>
  import('@/components/interviews/VoiceBlob').then((m) => ({ default: m.VoiceBlob })),
);

interface InterviewVoiceChatProps {
  interview: InterviewSession;
  /** Voice + VAD picked on the brief card. */
  voice?: RealtimeVoice;
  vad?: RealtimeVadSensitivity;
}

interface LiveCaption {
  role: 'interviewer' | 'candidate';
  text: string;
  final: boolean;
  ts: number;
}

const STATUS_COPY: Record<RealtimeStatus, string> = {
  idle: 'Ready',
  requesting_session: 'Preparing your session…',
  awaiting_mic: 'Asking for microphone…',
  connecting: 'Connecting…',
  live: 'Live',
  closing: 'Ending…',
  closed: 'Disconnected',
  error: 'Error',
};

export function InterviewVoiceChat({ interview, voice, vad }: InterviewVoiceChatProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const end = useEndInterview(interview.id);
  const qc = useQueryClient();
  const clientRef = useRef<RealtimeClient | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);

  // Pull voice/vad picked on the brief card if not passed explicitly.
  const saved = useMemo(() => readVoiceSettings(interview.id), [interview.id]);
  const effectiveVoice = voice ?? saved.voice;
  const effectiveVad = vad ?? saved.vad;

  const [status, setStatus] = useState<RealtimeStatus>('idle');
  const [muted, setMuted] = useState(false);
  const [captions, setCaptions] = useState<LiveCaption[]>([]);
  const [quotaRemainingSec, setQuotaRemainingSec] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [closeInfo, setCloseInfo] = useState<{ code: number; reason: string } | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const persistedTurns = interview.transcript;

  // Drives the blob.
  const norahIntensity = useAudioIntensity(remoteStream);
  const userIntensity = useAudioIntensity(localStream);

  const speaker: 'norah' | 'you' | 'idle' = useMemo(() => {
    if (status !== 'live') return 'idle';
    const last = captions[captions.length - 1];
    if (!last) return 'idle';
    if (!last.final && Date.now() - last.ts < 1500) {
      return last.role === 'interviewer' ? 'norah' : 'you';
    }
    return 'idle';
  }, [captions, status]);

  const handleFrame = useCallback((frame: RealtimeServerFrame) => {
    if (frame.type === 'ready') {
      setQuotaRemainingSec(frame.quota.remainingSec);
      return;
    }
    if (frame.type === 'intro') {
      setCaptions((prev) =>
        prev.length === 0
          ? [{ role: 'interviewer', text: frame.text, final: true, ts: Date.now() }]
          : prev,
      );
      return;
    }
    if (frame.type === 'transcript') {
      setCaptions((prev) => {
        const next = [...prev];
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
        return next.slice(-80);
      });
      return;
    }
    if (frame.type === 'cap_exceeded') {
      setErrorMessage("You've used today's voice practice minutes.");
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
      const m = REALTIME_CLOSE_MESSAGES[info.code];
      if (m) setErrorMessage((prev) => prev ?? m);
      void qc.invalidateQueries({ queryKey: ['interview', interview.id] });
      void qc.invalidateQueries({ queryKey: ['interviews'] });
      void qc.invalidateQueries({ queryKey: ['interviews', 'voiceQuota'] });
    },
    [qc, interview.id],
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
    setHasStarted(true);
    const client = createRealtimeClient({
      interviewId: interview.id,
      accessToken,
      voice: effectiveVoice,
      vad: effectiveVad,
      handlers: {
        onStatus: setStatus,
        onFrame: handleFrame,
        onClose: handleClose,
        onRemoteStream: (s) => {
          setRemoteStream(s);
          if (audioElRef.current) {
            audioElRef.current.srcObject = s;
            void audioElRef.current.play().catch(() => undefined);
          }
        },
        onLocalStream: setLocalStream,
      },
    });
    clientRef.current = client;
    await client.start();
  }, [accessToken, interview.id, effectiveVoice, effectiveVad, handleFrame, handleClose]);

  const handleEnd = useCallback(async () => {
    await clientRef.current?.end();
    try {
      await end.mutateAsync({ reason: 'user_ended' });
    } catch {
      /* server may have already settled */
    }
  }, [end]);

  const handleMute = useCallback(() => {
    const next = clientRef.current?.toggleMute();
    if (typeof next === 'boolean') setMuted(next);
  }, []);

  const handleCancel = useCallback(() => {
    clientRef.current?.cancel();
  }, []);

  // Cleanup on unmount + page hide.
  useEffect(() => {
    return () => {
      void clientRef.current?.end();
      clientRef.current = null;
    };
  }, []);
  useEffect(() => {
    const handler = (): void => {
      void clientRef.current?.end();
    };
    window.addEventListener('beforeunload', handler);
    window.addEventListener('pagehide', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
      window.removeEventListener('pagehide', handler);
    };
  }, []);

  // Auto-scroll transcript on new captions.
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [captions, persistedTurns.length]);

  const minutesRemaining = useMemo(() => {
    if (quotaRemainingSec == null) return null;
    return Math.max(0, Math.floor(quotaRemainingSec / 60));
  }, [quotaRemainingSec]);

  const isLive = status === 'live';
  const isFinished = status === 'closed' || status === 'error';

  // Combined ordered transcript per side: persisted first, then live captions.
  // We don't aggressively dedupe with the FE-batched persists because those
  // only land between sessions or after a reload — the user's eye reads
  // top-to-bottom and never sees duplicates within a single session.
  const norahTurns = useMemo(() => {
    const persisted = persistedTurns
      .filter((t) => t.role === 'interviewer')
      .map((t) => ({ text: t.text, final: true, ts: 0 }));
    const live = captions
      .filter((c) => c.role === 'interviewer')
      .map((c) => ({ text: c.text, final: c.final, ts: c.ts }));
    return [...persisted, ...live];
  }, [persistedTurns, captions]);
  const userTurns = useMemo(() => {
    const persisted = persistedTurns
      .filter((t) => t.role === 'candidate')
      .map((t) => ({ text: t.text, final: true, ts: 0 }));
    const live = captions
      .filter((c) => c.role === 'candidate')
      .map((c) => ({ text: c.text, final: c.final, ts: c.ts }));
    return [...persisted, ...live];
  }, [persistedTurns, captions]);

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[560px] rounded-3xl border border-gray-100 bg-white overflow-hidden">
      <audio ref={audioElRef} autoPlay playsInline className="hidden" />

      {/* Top zone: blob + status pill */}
      <div className="relative flex-[3] flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50/60 to-white px-4 py-6">
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-3 py-1 border border-gray-100 shadow-sm">
            <span
              className={cn(
                'inline-block h-2 w-2 rounded-full',
                isLive ? 'bg-emerald-600 animate-pulse' : 'bg-gray-300',
              )}
            />
            <span className="text-[11px] font-semibold text-[#111827]">
              {STATUS_COPY[status]}
            </span>
            {minutesRemaining != null && (
              <span className="text-[11px] text-gray-500">· {minutesRemaining} min left</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasStarted && !isFinished && (
              <>
                <Button variant="outline" size="sm" onClick={handleMute} disabled={!isLive}>
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
        </div>

        {!hasStarted && (
          <div className="z-10 max-w-md text-center">
            <p className="text-[15px] font-semibold text-[#111827]">
              Norah will introduce herself when you start.
            </p>
            <p className="mt-1 text-[12px] text-gray-600">
              We&apos;ll ask for microphone access first. Speak naturally — Norah waits for you to
              finish.
            </p>
            <div className="mt-4">
              <Button onClick={handleStart}>Start voice interview</Button>
            </div>
          </div>
        )}

        {hasStarted && (
          <Suspense
            fallback={<div className="h-[280px] w-[280px] rounded-full bg-emerald-50 animate-pulse" />}
          >
            <VoiceBlob
              norahIntensity={norahIntensity}
              userIntensity={userIntensity}
              speaker={speaker}
              className="z-10"
            />
          </Suspense>
        )}

        {hasStarted && (
          <p className="mt-3 text-[12px] text-gray-500">
            {speaker === 'norah'
              ? 'Norah is speaking'
              : speaker === 'you'
                ? 'Listening to you…'
                : isLive
                  ? muted
                    ? 'Microphone muted'
                    : 'Take your time'
                  : STATUS_COPY[status]}
          </p>
        )}

        {micDenied && (
          <div className="mt-3 z-10 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-900 max-w-md">
            <p className="font-semibold">Microphone access was blocked.</p>
            <p className="mt-1">
              Allow microphone access in your browser&apos;s site settings, then try again.
            </p>
            <div className="mt-2">
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

        {errorMessage && !micDenied && (
          <p className="mt-3 z-10 text-[12px] text-rose-600 max-w-md text-center">
            {errorMessage}
          </p>
        )}
        {closeInfo && !errorMessage && status !== 'live' && (
          <p className="mt-3 z-10 text-[12px] text-gray-500">
            Disconnected (code {closeInfo.code}).
          </p>
        )}
      </div>

      {/* Bottom zone: dual-column transcript */}
      <div
        ref={transcriptScrollRef}
        className="flex-[2] overflow-y-auto border-t border-gray-100 bg-white px-4 sm:px-6 py-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <TranscriptColumn label="Norah" tone="emerald" turns={norahTurns} />
          <TranscriptColumn label="You" tone="slate" turns={userTurns} />
        </div>
        {hasStarted && norahTurns.length === 0 && userTurns.length === 0 && isLive && (
          <p className="mt-2 text-center text-[12px] text-gray-400">
            Norah is preparing your first question…
          </p>
        )}
      </div>
    </div>
  );
}

interface TranscriptColumnProps {
  label: string;
  tone: 'emerald' | 'slate';
  turns: { text: string; final: boolean; ts: number }[];
}

function TranscriptColumn({ label, tone, turns }: TranscriptColumnProps) {
  return (
    <div>
      <p
        className={cn(
          'text-[10px] uppercase tracking-wide font-semibold mb-2',
          tone === 'emerald' ? 'text-emerald-700' : 'text-slate-700',
        )}
      >
        {label}
      </p>
      <div className="space-y-2">
        {turns.length === 0 && (
          <p className="text-[12px] text-gray-300 italic">…</p>
        )}
        {turns.map((t, i) => (
          <div
            key={`${tone}-${i}`}
            className={cn(
              'rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap',
              tone === 'emerald'
                ? 'bg-emerald-50/70 text-emerald-900 border border-emerald-100'
                : 'bg-slate-50 text-slate-900 border border-slate-100',
              !t.final && 'opacity-80 italic',
            )}
          >
            {t.text}
            {!t.final && (
              <span
                aria-hidden
                className={cn(
                  'inline-block ml-1 w-2 h-2 rounded-full animate-pulse',
                  tone === 'emerald' ? 'bg-emerald-400' : 'bg-slate-400',
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export type { TranscriptTurn };
