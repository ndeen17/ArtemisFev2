/**
 * Phase 8G — Browser realtime client over WebRTC.
 *
 * Replaces the old WS+PCM16 relay. Audio now flows browser ↔ OpenAI directly,
 * which removes the 200–400 ms of buffering through our backend that was
 * confusing OpenAI's server-side VAD ("the AI cuts me off mid-sentence").
 *
 * Flow:
 *   1. Ask our backend to mint an ephemeral session key (carries the Norah
 *      persona + brief + CV-gap context).
 *   2. Open a `RTCPeerConnection`. Add the candidate's mic track.
 *      Create a data channel `oai-events` for JSON control frames.
 *   3. Negotiate by POSTing the SDP offer to OpenAI with the ephemeral key.
 *   4. Open a second, tiny WebSocket to our backend (`/realtime/control`) for
 *      heartbeat-based quota accounting + observability event log.
 *   5. Forward finalised transcript turns up to our REST batched endpoint.
 *
 * The exposed surface mirrors the old `RealtimeClient` so the chat component
 * only changes where it needs to (blob/transcript layout) — speak/mute/end
 * verbs are stable.
 */
import type { RealtimeSessionResponse, RealtimeVoice, RealtimeVadSensitivity } from '@artemis/shared';
import { interviewApi } from '@/features/interviews/api';
import { getWsBaseUrl } from '@/lib/wsUrl';

export type RealtimeStatus =
  | 'idle'
  | 'requesting_session'
  | 'awaiting_mic'
  | 'connecting'
  | 'live'
  | 'closing'
  | 'closed'
  | 'error';

export interface RealtimeReadyFrame {
  type: 'ready';
  quota: { capSec: number; remainingSec: number };
}
export interface RealtimeTranscriptFrame {
  type: 'transcript';
  role: 'interviewer' | 'candidate';
  text: string;
  final: boolean;
}
export interface RealtimeCapExceededFrame {
  type: 'cap_exceeded';
}
export interface RealtimeErrorFrame {
  type: 'error';
  code?: string;
  message?: string;
}
/** Norah's pre-rendered intro caption — surfaced before audio reaches the speakers. */
export interface RealtimeIntroFrame {
  type: 'intro';
  text: string;
}
export type RealtimeServerFrame =
  | RealtimeReadyFrame
  | RealtimeTranscriptFrame
  | RealtimeCapExceededFrame
  | RealtimeErrorFrame
  | RealtimeIntroFrame;

export interface RealtimeHandlers {
  onStatus(status: RealtimeStatus): void;
  onFrame(frame: RealtimeServerFrame): void;
  onClose(info: { code: number; reason: string }): void;
  /** Remote (Norah) audio stream — attach to <audio> AND blob analyser. */
  onRemoteStream?(stream: MediaStream): void;
  /** Local (mic) audio stream — for the blob's user-side reactivity. */
  onLocalStream?(stream: MediaStream): void;
}

export interface RealtimeClient {
  start(): Promise<void>;
  /** Cancel Norah's current response (barge-in, but we now rely on server VAD). */
  cancel(): void;
  /** Mute/unmute the candidate's mic. Returns the new state. */
  toggleMute(mute?: boolean): boolean;
  isMuted(): boolean;
  /** Flush pending transcripts and close everything. */
  end(): Promise<void>;
}

interface CreateOpts {
  interviewId: string;
  accessToken: string;
  voice?: RealtimeVoice;
  vad?: RealtimeVadSensitivity;
  handlers: RealtimeHandlers;
}

const OPENAI_REALTIME_BASE = 'https://api.openai.com/v1/realtime';
const HEARTBEAT_INTERVAL_MS = 10_000;
const TRANSCRIPT_BATCH_SIZE = 5;
const CONNECT_TIMEOUT_MS = 6_000;

/** ICE servers — Google's public STUN is sufficient for OpenAI's relay. */
const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

interface PendingTurn {
  role: 'interviewer' | 'candidate';
  text: string;
  audioMs?: number;
  at: string;
}

export function createRealtimeClient(opts: CreateOpts): RealtimeClient {
  const { interviewId, accessToken, handlers } = opts;
  let pc: RTCPeerConnection | null = null;
  let dc: RTCDataChannel | null = null;
  let controlWs: WebSocket | null = null;
  let localStream: MediaStream | null = null;
  let started = false;
  let closed = false;
  let muted = false;
  let session: RealtimeSessionResponse | null = null;
  const pendingTurns: PendingTurn[] = [];
  // Tracks the latest interim text per role so we can promote them to a full
  // turn once the model emits a `*.completed` event.
  const interim = { interviewer: '', candidate: '' };
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let connectTimer: ReturnType<typeof setTimeout> | null = null;
  let sessionStartedAt = 0;

  function setStatus(s: RealtimeStatus): void {
    handlers.onStatus(s);
  }

  function logEvent(eventType: string, latencyMs?: number, detail?: string): void {
    if (!controlWs || controlWs.readyState !== WebSocket.OPEN) return;
    try {
      controlWs.send(JSON.stringify({ type: 'event', eventType, latencyMs, detail }));
    } catch {
      /* noop */
    }
  }

  async function flushTranscripts(force = false): Promise<void> {
    if (pendingTurns.length === 0) return;
    if (!force && pendingTurns.length < TRANSCRIPT_BATCH_SIZE) return;
    const batch = pendingTurns.splice(0, pendingTurns.length);
    try {
      await interviewApi.realtimeTranscript(interviewId, { turns: batch });
    } catch (err) {
      // Re-queue at the front so we retry on the next flush attempt.
      pendingTurns.unshift(...batch);
      logEvent('transcript_flush_failed', undefined, err instanceof Error ? err.message : 'unknown');
    }
  }

  function handleDataChannelMessage(ev: MessageEvent): void {
    let msg: { type?: string; [k: string]: unknown };
    try {
      msg = JSON.parse(typeof ev.data === 'string' ? ev.data : '');
    } catch {
      return;
    }
    const type = String(msg.type ?? '');
    // Conversation transcript events. The realtime API names changed
    // between previews — handle both the GA and beta-era spellings so we
    // don't have to chase API drift in production.
    //
    // GA:   conversation.item.input_audio_transcription.completed
    //       response.audio_transcript.delta / .done
    // Beta: response.audio_transcript.delta with `delta` field; completed = `done`.
    if (type === 'response.audio_transcript.delta') {
      const delta = String((msg as { delta?: unknown }).delta ?? '');
      if (!delta) return;
      interim.interviewer += delta;
      handlers.onFrame({
        type: 'transcript',
        role: 'interviewer',
        text: interim.interviewer,
        final: false,
      });
      return;
    }
    if (type === 'response.audio_transcript.done' || type === 'response.done') {
      const text = interim.interviewer.trim();
      if (text.length > 0) {
        handlers.onFrame({ type: 'transcript', role: 'interviewer', text, final: true });
        pendingTurns.push({ role: 'interviewer', text, at: new Date().toISOString() });
        interim.interviewer = '';
        void flushTranscripts();
      }
      logEvent('response.done');
      return;
    }
    if (type === 'conversation.item.input_audio_transcription.delta') {
      const delta = String((msg as { delta?: unknown }).delta ?? '');
      if (!delta) return;
      interim.candidate += delta;
      handlers.onFrame({
        type: 'transcript',
        role: 'candidate',
        text: interim.candidate,
        final: false,
      });
      return;
    }
    if (type === 'conversation.item.input_audio_transcription.completed') {
      const transcriptText = String((msg as { transcript?: unknown }).transcript ?? '').trim();
      const text = transcriptText || interim.candidate.trim();
      if (text.length > 0) {
        handlers.onFrame({ type: 'transcript', role: 'candidate', text, final: true });
        pendingTurns.push({ role: 'candidate', text, at: new Date().toISOString() });
        interim.candidate = '';
        void flushTranscripts();
      }
      return;
    }
    if (type === 'input_audio_buffer.speech_started') {
      logEvent('speech_started');
      return;
    }
    if (type === 'input_audio_buffer.speech_stopped') {
      logEvent('speech_stopped');
      return;
    }
    if (type === 'response.created') {
      logEvent('response.created');
      return;
    }
    if (type === 'error') {
      const message = String(
        (msg as { error?: { message?: unknown } }).error?.message ?? 'realtime error',
      );
      handlers.onFrame({ type: 'error', code: 'OPENAI_ERROR', message });
      logEvent('openai_error', undefined, message.slice(0, 400));
    }
  }

  function startHeartbeat(): void {
    sessionStartedAt = Date.now();
    heartbeatTimer = setInterval(() => {
      if (!controlWs || controlWs.readyState !== WebSocket.OPEN) return;
      const elapsedSec = Math.round((Date.now() - sessionStartedAt) / 1000);
      try {
        controlWs.send(JSON.stringify({ type: 'heartbeat', elapsedSec }));
      } catch {
        /* noop */
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  function openControlSocket(): void {
    const base = getWsBaseUrl();
    const url = `${base}/interviews/${interviewId}/realtime/control?token=${encodeURIComponent(accessToken)}`;
    const ws = new WebSocket(url);
    controlWs = ws;
    ws.onmessage = (ev) => {
      let frame: RealtimeServerFrame | { type: 'quota'; remainingSec: number };
      try {
        frame = JSON.parse(String(ev.data));
      } catch {
        return;
      }
      if ('type' in frame && frame.type === 'quota') return; // currently informational
      handlers.onFrame(frame as RealtimeServerFrame);
    };
    ws.onclose = (ev) => {
      if (closed) return;
      // Treat cap_exceeded / idle_timeout as fatal — surface and close.
      if (ev.code === 4429 || ev.code === 4408) {
        void close({ code: ev.code, reason: ev.reason });
      }
    };
    ws.onerror = () => {
      logEvent('control_ws_error');
    };
  }

  async function negotiateWebRTC(s: RealtimeSessionResponse): Promise<void> {
    pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Remote audio track → caller wires it up to <audio> + blob analyser.
    pc.ontrack = (ev) => {
      const [stream] = ev.streams;
      if (stream) handlers.onRemoteStream?.(stream);
    };

    // Mic capture.
    setStatus('awaiting_mic');
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
    } catch (err) {
      throw Object.assign(new Error('mic_denied'), {
        code: 4001,
        cause: err,
      });
    }
    handlers.onLocalStream?.(localStream);
    for (const track of localStream.getAudioTracks()) pc.addTrack(track, localStream);

    // Data channel for JSON events.
    dc = pc.createDataChannel('oai-events');
    dc.onmessage = handleDataChannelMessage;

    setStatus('connecting');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // POST SDP to OpenAI with the ephemeral key.
    const url = `${OPENAI_REALTIME_BASE}?model=${encodeURIComponent(s.sessionConfig.model)}`;
    const sdpRes = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${s.ephemeralKey}`,
        'Content-Type': 'application/sdp',
      },
      body: offer.sdp ?? '',
    });
    if (!sdpRes.ok) {
      const body = await sdpRes.text().catch(() => '');
      throw Object.assign(new Error(`openai_sdp_${sdpRes.status}`), {
        code: 4500,
        detail: body.slice(0, 200),
      });
    }
    const answer: RTCSessionDescriptionInit = {
      type: 'answer',
      sdp: await sdpRes.text(),
    };
    await pc.setRemoteDescription(answer);

    // Connect timeout — if iceConnectionState doesn't reach connected/completed
    // within CONNECT_TIMEOUT_MS, surface an error.
    connectTimer = setTimeout(() => {
      if (pc && pc.connectionState !== 'connected') {
        handlers.onFrame({
          type: 'error',
          code: 'WEBRTC_TIMEOUT',
          message: 'Voice unavailable on this network. Try text mode.',
        });
        void close({ code: 4502, reason: 'webrtc_timeout' });
      }
    }, CONNECT_TIMEOUT_MS);

    pc.onconnectionstatechange = () => {
      const state = pc?.connectionState;
      logEvent(`pc.${state}`);
      if (state === 'connected') {
        if (connectTimer) {
          clearTimeout(connectTimer);
          connectTimer = null;
        }
        setStatus('live');
        // Surface the pre-rendered intro caption immediately so the screen
        // never feels empty during the first ~300ms before audio arrives.
        if (s.persona.intro) {
          handlers.onFrame({ type: 'intro', text: s.persona.intro });
        }
      } else if (state === 'failed' || state === 'disconnected') {
        void close({ code: 4500, reason: `pc_${state}` });
      }
    };
  }

  async function start(): Promise<void> {
    if (started) return;
    started = true;
    setStatus('requesting_session');
    try {
      session = await interviewApi.realtimeSession(interviewId, {
        voice: opts.voice,
        vad: opts.vad,
      });
    } catch (err) {
      setStatus('error');
      const code = (err as { response?: { status?: number } }).response?.status ?? 4500;
      handlers.onClose({
        code: code === 429 ? 4429 : 4500,
        reason: err instanceof Error ? err.message : 'broker_error',
      });
      return;
    }
    openControlSocket();
    try {
      await negotiateWebRTC(session);
    } catch (err) {
      setStatus('error');
      const e = err as { code?: number; message?: string };
      handlers.onClose({ code: e.code ?? 4500, reason: e.message ?? 'webrtc_failed' });
      await close({ code: e.code ?? 4500, reason: e.message ?? 'webrtc_failed' });
      return;
    }
    startHeartbeat();
  }

  function cancel(): void {
    if (!dc || dc.readyState !== 'open') return;
    try {
      dc.send(JSON.stringify({ type: 'response.cancel' }));
    } catch {
      /* noop */
    }
  }

  function toggleMute(force?: boolean): boolean {
    const next = typeof force === 'boolean' ? force : !muted;
    muted = next;
    if (localStream) {
      for (const track of localStream.getAudioTracks()) track.enabled = !next;
    }
    return muted;
  }

  function isMuted(): boolean {
    return muted;
  }

  async function close(info: { code: number; reason: string }): Promise<void> {
    if (closed) return;
    closed = true;
    setStatus('closing');
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (connectTimer) clearTimeout(connectTimer);
    heartbeatTimer = null;
    connectTimer = null;

    // Best-effort flush of any remaining transcript turns.
    await flushTranscripts(true).catch(() => undefined);

    // Tell the backend we're done so it can settle quota.
    if (controlWs && controlWs.readyState === WebSocket.OPEN) {
      try {
        controlWs.send(JSON.stringify({ type: 'end' }));
      } catch {
        /* noop */
      }
      try {
        controlWs.close();
      } catch {
        /* noop */
      }
    }
    controlWs = null;

    if (dc) {
      try {
        dc.close();
      } catch {
        /* noop */
      }
    }
    dc = null;

    if (pc) {
      try {
        pc.close();
      } catch {
        /* noop */
      }
    }
    pc = null;

    if (localStream) {
      for (const track of localStream.getTracks()) track.stop();
      localStream = null;
    }
    setStatus('closed');
    handlers.onClose(info);
  }

  async function end(): Promise<void> {
    await close({ code: 1000, reason: 'user_ended' });
  }

  return { start, cancel, toggleMute, isMuted, end };
}

/** Close codes the FE renders human-friendly messages for. */
export const REALTIME_CLOSE_MESSAGES: Record<number, string> = {
  4001: 'Microphone access was denied. Allow it and try again.',
  4400: 'Bad request — this session may be invalid.',
  4401: 'Your session expired. Sign in again.',
  4403: 'This session is not in voice mode or is no longer active.',
  4404: 'Interview not found.',
  4408: 'No audio detected for a while — we ended the session.',
  4409: 'This interview was opened in another tab or device. Only one voice session at a time.',
  4429: "You've used today's voice practice minutes.",
  4500: 'Realtime service failed. Please try again.',
  4502: 'Voice unavailable on this network. Try text mode.',
  4503: 'Voice service is not configured on the server.',
};
