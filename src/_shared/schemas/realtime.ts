import { z } from 'zod';
import { TranscriptTurnSchema } from './interview.js';

/**
 * Phase 8G — Realtime voice broker contracts.
 *
 * The browser POSTs `RealtimeSessionRequestSchema` to
 * `/interviews/:id/realtime/session` and gets back an ephemeral OpenAI session
 * key it can use to open a direct WebRTC peer connection. The voice + VAD
 * choices come from the brief-card UI and are also persisted server-side as
 * the brief's voice settings (so resumed sessions keep the same voice).
 *
 * Transcript persistence: while WebRTC handles audio directly, the browser
 * forwards finalised transcript turns to us in batches via
 * `/interviews/:id/realtime/transcript` so resumed sessions and the post-
 * session debrief stay grounded in real text.
 */

export const REALTIME_VOICE_OPTIONS = ['cedar', 'marin', 'verse', 'coral', 'alloy'] as const;
export const RealtimeVoiceSchema = z.enum(REALTIME_VOICE_OPTIONS);
export type RealtimeVoice = z.infer<typeof RealtimeVoiceSchema>;

export const REALTIME_VAD_OPTIONS = ['low', 'medium', 'high'] as const;
export const RealtimeVadSchema = z.enum(REALTIME_VAD_OPTIONS);
export type RealtimeVadSensitivity = z.infer<typeof RealtimeVadSchema>;

export const RealtimeVoiceLabels: Record<RealtimeVoice, string> = {
  cedar: 'Cedar — warm, neutral',
  marin: 'Marin — bright, clear',
  verse: 'Verse — calm, measured',
  coral: 'Coral — energetic',
  alloy: 'Alloy — classic',
};

export const RealtimeVadLabels: Record<RealtimeVadSensitivity, string> = {
  low: 'Patient (waits longer before responding)',
  medium: 'Balanced',
  high: 'Snappy (responds quickly)',
};

export const RealtimeSessionRequestSchema = z.object({
  voice: RealtimeVoiceSchema.optional(),
  vad: RealtimeVadSchema.optional(),
});
export type RealtimeSessionRequest = z.infer<typeof RealtimeSessionRequestSchema>;

export const RealtimeSessionResponseSchema = z.object({
  ephemeralKey: z.string().min(1),
  expiresAt: z.number().int().nonnegative(),
  sessionConfig: z.object({
    model: z.string().min(1),
    voice: RealtimeVoiceSchema,
    vadMs: z.number().int().min(100).max(2000),
  }),
  persona: z.object({
    name: z.literal('Norah'),
    intro: z.string().min(1),
  }),
});
export type RealtimeSessionResponse = z.infer<typeof RealtimeSessionResponseSchema>;

/** Browser → BE: a small batch of finalised transcript turns to persist. */
export const RealtimeTranscriptBatchSchema = z.object({
  turns: z.array(TranscriptTurnSchema).min(1).max(20),
});
export type RealtimeTranscriptBatch = z.infer<typeof RealtimeTranscriptBatchSchema>;

/** Single events the FE forwards over the quota WS for observability. */
export const RealtimeEventLogSchema = z.object({
  eventType: z.string().min(1).max(80),
  latencyMs: z.number().int().min(0).max(60_000).optional(),
  detail: z.string().max(500).optional(),
});
export type RealtimeEventLog = z.infer<typeof RealtimeEventLogSchema>;
