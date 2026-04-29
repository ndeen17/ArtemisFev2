/**
 * Phase 8D — Browser-side realtime client for the voice interview gateway.
 *
 * Responsibilities:
 *   1. Capture mic via getUserMedia + AudioWorklet → PCM16 mono @ 24kHz.
 *   2. Stream PCM16 frames over WebSocket to the BE gateway as binary.
 *   3. Receive binary PCM16 audio from the model and play it back via a queued
 *      AudioBuffer scheduler.
 *   4. Surface JSON control frames (ready / transcript / cap_exceeded / error).
 *
 * The gateway URL is built from `getWsBaseUrl()` and includes the access JWT
 * as a query param (browsers cannot set Authorization on WS handshakes).
 */
import { getWsBaseUrl } from '@/lib/wsUrl';

export interface RealtimeReadyFrame {
  type: 'ready';
  quota: { capSec: number; remainingSec: number };
}
export interface RealtimeTranscriptFrame {
  type: 'transcript';
  role: 'interviewer' | 'candidate';
  text: string;
  final: boolean;
  audioMs?: number;
}
export interface RealtimeCapExceededFrame {
  type: 'cap_exceeded';
}
export interface RealtimeErrorFrame {
  type: 'error';
  code?: string;
  message?: string;
}
export type RealtimeServerFrame =
  | RealtimeReadyFrame
  | RealtimeTranscriptFrame
  | RealtimeCapExceededFrame
  | RealtimeErrorFrame;

export type RealtimeStatus =
  | 'idle'
  | 'connecting'
  | 'awaiting_mic'
  | 'live'
  | 'reconnecting'
  | 'closing'
  | 'closed'
  | 'error';

export interface RealtimeHandlers {
  onStatus(status: RealtimeStatus): void;
  onFrame(frame: RealtimeServerFrame): void;
  onMicLevel?(level: number): void;
  onClose(info: { code: number; reason: string }): void;
  onReconnect?(attempt: number, nextDelayMs: number): void;
}

export interface RealtimeClient {
  start(): Promise<void>;
  cancel(): void;
  end(): void;
  close(): void;
  toggleMute(mute?: boolean): boolean;
  isMuted(): boolean;
}

/** Inline AudioWorklet processor — converts Float32 mono frames into 100ms PCM16 chunks. */
const WORKLET_SOURCE = `
class CapturePCM16Processor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const o = (options && options.processorOptions) || {};
    this.targetSampleRate = o.targetSampleRate || 24000;
    this.frameMs = o.frameMs || 100;
    this.frameSize = Math.round((this.targetSampleRate * this.frameMs) / 1000);
    this.buffer = new Float32Array(this.frameSize);
    this.bufferIndex = 0;
    this.muted = false;
    this.port.onmessage = (e) => {
      if (e.data && e.data.type === 'mute') this.muted = !!e.data.value;
    };
  }
  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];
    if (!channel) return true;
    if (this.muted) return true;
    // sampleRate is the AudioContext rate (typically 48000). Down/upsample by
    // simple linear interpolation to targetSampleRate.
    const ratio = sampleRate / this.targetSampleRate;
    let level = 0;
    for (let i = 0; i < channel.length / ratio; i++) {
      const srcIdx = i * ratio;
      const lo = Math.floor(srcIdx);
      const hi = Math.min(channel.length - 1, lo + 1);
      const frac = srcIdx - lo;
      const sample = channel[lo] * (1 - frac) + channel[hi] * frac;
      const abs = sample < 0 ? -sample : sample;
      if (abs > level) level = abs;
      this.buffer[this.bufferIndex++] = sample;
      if (this.bufferIndex >= this.frameSize) {
        const pcm = new Int16Array(this.frameSize);
        for (let k = 0; k < this.frameSize; k++) {
          let s = this.buffer[k];
          if (s > 1) s = 1; else if (s < -1) s = -1;
          pcm[k] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        this.port.postMessage({ type: 'pcm', buffer: pcm.buffer, level }, [pcm.buffer]);
        this.bufferIndex = 0;
      }
    }
    if (level > 0) this.port.postMessage({ type: 'level', value: level });
    return true;
  }
}
registerProcessor('artemis-capture-pcm16', CapturePCM16Processor);
`;

let workletBlobUrl: string | null = null;
function getWorkletUrl(): string {
  if (!workletBlobUrl) {
    const blob = new Blob([WORKLET_SOURCE], { type: 'application/javascript' });
    workletBlobUrl = URL.createObjectURL(blob);
  }
  return workletBlobUrl;
}

const CAPTURE_SAMPLE_RATE = 24000;
const PLAYBACK_SAMPLE_RATE = 24000;

interface CreateOpts {
  interviewId: string;
  accessToken: string;
  handlers: RealtimeHandlers;
}

export function createRealtimeClient(opts: CreateOpts): RealtimeClient {
  const { interviewId, accessToken, handlers } = opts;
  let ws: WebSocket | null = null;
  let audioCtx: AudioContext | null = null;
  let stream: MediaStream | null = null;
  let workletNode: AudioWorkletNode | null = null;
  let micSource: MediaStreamAudioSourceNode | null = null;
  let muted = false;
  let nextPlaybackAt = 0;
  let started = false;
  let userClosed = false;
  let reconnectAttempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let status: RealtimeStatus = 'idle';

  // Phase 8E — only retry on transient WS close codes. Never retry on app-level
  // rejections (4xxx custom codes from the gateway) or intentional client closes.
  const FATAL_CODES = new Set([1000, 4001, 4002, 4003, 4400, 4401, 4403, 4404, 4408, 4429, 4500, 4503]);
  const MAX_RECONNECT_ATTEMPTS = 4;
  function backoffMs(attempt: number): number {
    return Math.min(8000, 1000 * Math.pow(2, attempt - 1));
  }

  function setStatus(s: RealtimeStatus): void {
    status = s;
    handlers.onStatus(s);
  }

  function teardown(): void {
    try {
      workletNode?.port.close();
    } catch {
      /* noop */
    }
    workletNode?.disconnect();
    micSource?.disconnect();
    workletNode = null;
    micSource = null;
    if (stream) {
      for (const t of stream.getTracks()) t.stop();
      stream = null;
    }
    if (audioCtx && audioCtx.state !== 'closed') {
      void audioCtx.close().catch(() => undefined);
    }
    audioCtx = null;
  }

  function playPcm16(buffer: ArrayBuffer): void {
    if (!audioCtx || audioCtx.state === 'closed') return;
    const view = new Int16Array(buffer);
    if (view.length === 0) return;
    const float = new Float32Array(view.length);
    for (let i = 0; i < view.length; i++) float[i] = view[i] / (view[i] < 0 ? 0x8000 : 0x7fff);
    const audioBuf = audioCtx.createBuffer(1, float.length, PLAYBACK_SAMPLE_RATE);
    audioBuf.getChannelData(0).set(float);
    const src = audioCtx.createBufferSource();
    src.buffer = audioBuf;
    src.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    if (nextPlaybackAt < now) nextPlaybackAt = now + 0.02;
    src.start(nextPlaybackAt);
    nextPlaybackAt += audioBuf.duration;
  }

  async function start(): Promise<void> {
    if (started) return;
    started = true;
    setStatus('awaiting_mic');
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      });
    } catch (err) {
      setStatus('error');
      handlers.onClose({ code: 4001, reason: err instanceof Error ? err.message : 'mic_denied' });
      return;
    }
    try {
      const Ctor = (window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)!;
      audioCtx = new Ctor({ sampleRate: PLAYBACK_SAMPLE_RATE });
      await audioCtx.audioWorklet.addModule(getWorkletUrl());
      workletNode = new AudioWorkletNode(audioCtx, 'artemis-capture-pcm16', {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        processorOptions: { targetSampleRate: CAPTURE_SAMPLE_RATE, frameMs: 100 },
      });
      micSource = audioCtx.createMediaStreamSource(stream);
      micSource.connect(workletNode);
      workletNode.port.onmessage = (e: MessageEvent) => {
        const msg = e.data as { type: string; buffer?: ArrayBuffer; value?: number };
        if (msg.type === 'pcm' && msg.buffer && ws?.readyState === WebSocket.OPEN) {
          ws.send(msg.buffer);
        } else if (msg.type === 'level' && handlers.onMicLevel) {
          handlers.onMicLevel(msg.value ?? 0);
        }
      };
    } catch (err) {
      setStatus('error');
      handlers.onClose({
        code: 4002,
        reason: err instanceof Error ? err.message : 'audio_init_failed',
      });
      teardown();
      return;
    }

    setStatus('connecting');
    openWebSocket();
  }

  function openWebSocket(): void {
    const url = `${getWsBaseUrl()}/interviews/${interviewId}/realtime?token=${encodeURIComponent(
      accessToken,
    )}`;
    try {
      ws = new WebSocket(url);
    } catch (err) {
      setStatus('error');
      handlers.onClose({ code: 4003, reason: err instanceof Error ? err.message : 'ws_init' });
      teardown();
      return;
    }
    ws.binaryType = 'arraybuffer';
    ws.onopen = () => {
      reconnectAttempt = 0;
      setStatus('live');
    };
    ws.onmessage = (e: MessageEvent) => {
      if (typeof e.data === 'string') {
        try {
          const frame = JSON.parse(e.data) as RealtimeServerFrame;
          handlers.onFrame(frame);
        } catch {
          /* drop */
        }
        return;
      }
      if (e.data instanceof ArrayBuffer) {
        playPcm16(e.data);
      } else if (e.data instanceof Blob) {
        void e.data.arrayBuffer().then(playPcm16);
      }
    };
    ws.onerror = () => {
      // Close handler will follow with the actual code.
    };
    ws.onclose = (e: CloseEvent) => {
      const code = e.code;
      const isFatal = userClosed || FATAL_CODES.has(code);
      if (!isFatal && reconnectAttempt < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempt += 1;
        const delay = backoffMs(reconnectAttempt);
        setStatus('reconnecting');
        handlers.onReconnect?.(reconnectAttempt, delay);
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          openWebSocket();
        }, delay);
        return;
      }
      const wasUserClose = userClosed;
      userClosed = true;
      setStatus('closed');
      teardown();
      handlers.onClose({
        code,
        reason: e.reason || (wasUserClose ? 'user_closed' : 'server_closed'),
      });
    };
  }

  function send(obj: unknown): void {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj));
    }
  }

  return {
    start,
    cancel(): void {
      send({ type: 'cancel' });
    },
    end(): void {
      if (!ws) return;
      setStatus('closing');
      send({ type: 'end' });
    },
    close(): void {
      userClosed = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      try {
        ws?.close(1000, 'client_close');
      } catch {
        /* noop */
      }
      teardown();
      setStatus('closed');
    },
    toggleMute(force?: boolean): boolean {
      muted = force === undefined ? !muted : force;
      workletNode?.port.postMessage({ type: 'mute', value: muted });
      return muted;
    },
    isMuted(): boolean {
      return muted;
    },
  };

  // Reference `status` in the closure so eslint's no-unused-vars stays happy
  // (the value is read indirectly via setStatus).
  void status;
}
