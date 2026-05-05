import {
  REALTIME_VOICE_OPTIONS,
  REALTIME_VAD_OPTIONS,
  RealtimeVoiceLabels,
  RealtimeVadLabels,
  type RealtimeVoice,
  type RealtimeVadSensitivity,
} from '@artemis/shared';

/**
 * Phase 8G — Voice + VAD selection persistence.
 *
 * The brief card writes the user's choice here; the voice chat component
 * reads it back when the status flips to `live`. SessionStorage keeps it
 * scoped to the tab so two parallel sessions can't interfere.
 */
const STORAGE_KEY = 'artemis.voiceSettings';

export interface VoiceSettings {
  voice: RealtimeVoice;
  vad: RealtimeVadSensitivity;
}

const DEFAULT_SETTINGS: VoiceSettings = { voice: 'cedar', vad: 'medium' };

function safeRead(): Record<string, VoiceSettings> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function readVoiceSettings(interviewId: string): VoiceSettings {
  const all = safeRead();
  const found = all[interviewId];
  if (!found) return { ...DEFAULT_SETTINGS };
  if (
    REALTIME_VOICE_OPTIONS.includes(found.voice) &&
    REALTIME_VAD_OPTIONS.includes(found.vad)
  ) {
    return found;
  }
  return { ...DEFAULT_SETTINGS };
}

export function writeVoiceSettings(interviewId: string, settings: VoiceSettings): void {
  if (typeof window === 'undefined') return;
  try {
    const all = safeRead();
    all[interviewId] = settings;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* swallow — sessionStorage may be disabled in private mode */
  }
}

export { REALTIME_VOICE_OPTIONS, REALTIME_VAD_OPTIONS, RealtimeVoiceLabels, RealtimeVadLabels };
export type { RealtimeVoice, RealtimeVadSensitivity };
