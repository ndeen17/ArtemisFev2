/**
 * Builds the WebSocket base URL for the voice-mode interview gateway.
 *
 * Dev: Vite proxies /ws/* → ws://localhost:4000/* (see vite.config.ts).
 * Prod: set VITE_WS_BASE_URL to the absolute backend WS origin (e.g. wss://api.example.com).
 *       If unset, falls back to the page origin with /ws prefix and matching scheme.
 */
export function getWsBaseUrl(): string {
  const override = import.meta.env.VITE_WS_BASE_URL as string | undefined;
  if (override) return override.replace(/\/+$/, '');
  if (typeof window === 'undefined') return '';
  const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${scheme}://${window.location.host}/ws`;
}
