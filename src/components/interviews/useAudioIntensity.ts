import { useEffect, useRef } from 'react';

/**
 * Phase 8G — Audio reactivity hook for the voice-interview blob.
 *
 * Wires a `MediaStream` into a Web Audio `AnalyserNode` and continuously
 * computes a smoothed 0..1 "intensity" value from the audio's RMS energy.
 *
 * Returns a *ref* (not state) on purpose: the blob's render loop runs at 60fps
 * via `requestAnimationFrame` / `useFrame` and shouldn't trigger React renders
 * on every tick. Consumers read `intensityRef.current` inside their frame loop.
 *
 * Idle behaviour: when no stream (or stream is muted) the value drifts toward
 * 0, so the blob's idle shimmer fades cleanly.
 */
export interface UseAudioIntensityOpts {
  /** Smoothing factor (0..1) — higher = smoother but laggier. Default 0.7. */
  smoothing?: number;
  /** Multiplier applied to the raw RMS so soft speech still moves the blob. */
  gain?: number;
}

export function useAudioIntensity(
  stream: MediaStream | null,
  opts: UseAudioIntensityOpts = {},
): React.MutableRefObject<number> {
  const { smoothing = 0.7, gain = 1.6 } = opts;
  const intensityRef = useRef(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      intensityRef.current = 0;
      return;
    }
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    ctxRef.current = ctx;
    analyserRef.current = analyser;
    sourceRef.current = source;

    const bins = new Uint8Array(analyser.frequencyBinCount);

    const tick = (): void => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(bins);
      let sum = 0;
      // Weight low-mid frequencies more — speech energy lives ~100-3000Hz
      // and we want the blob to ignore hiss/sibilance.
      const cutoff = Math.min(bins.length, 96);
      for (let i = 0; i < cutoff; i++) {
        const v = bins[i] / 255;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / cutoff);
      const target = Math.min(1, rms * gain);
      intensityRef.current =
        intensityRef.current * smoothing + target * (1 - smoothing);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      try {
        source.disconnect();
      } catch {
        /* noop */
      }
      try {
        analyser.disconnect();
      } catch {
        /* noop */
      }
      void ctx.close().catch(() => undefined);
      sourceRef.current = null;
      analyserRef.current = null;
      ctxRef.current = null;
      intensityRef.current = 0;
    };
  }, [stream, smoothing, gain]);

  return intensityRef;
}
