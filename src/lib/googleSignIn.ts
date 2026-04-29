/**
 * Lightweight wrapper around Google Identity Services (GIS).
 * Loads the GIS script on demand, prompts the user, and resolves with the ID
 * token (JWT) which the backend verifies via `google-auth-library`.
 *
 * Reads `VITE_GOOGLE_CLIENT_ID` at build time. Throws a friendly error if it's
 * missing so the UI can surface "Google sign-in is not configured".
 */

interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

interface GoogleIdConfiguration {
  client_id: string;
  callback: (resp: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  use_fedcm_for_prompt?: boolean;
  ux_mode?: 'popup' | 'redirect';
}

interface GoogleAccountsId {
  initialize(config: GoogleIdConfiguration): void;
  prompt(listener?: (notification: PromptMomentNotification) => void): void;
  cancel(): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
  disableAutoSelect(): void;
}

interface PromptMomentNotification {
  isNotDisplayed(): boolean;
  isSkippedMoment(): boolean;
  isDismissedMoment(): boolean;
  getNotDisplayedReason(): string;
  getSkippedReason(): string;
  getDismissedReason(): string;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const GIS_SRC = 'https://accounts.google.com/gsi/client';
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('GIS load failed')), { once: true });
      return;
    }
    const tag = document.createElement('script');
    tag.src = GIS_SRC;
    tag.async = true;
    tag.defer = true;
    tag.onload = () => resolve();
    tag.onerror = () => reject(new Error('GIS load failed'));
    document.head.appendChild(tag);
  });
  return scriptPromise;
}

/**
 * Triggers the Google sign-in flow and resolves with a Google-issued ID token.
 *
 * Tries the One Tap / FedCM `prompt()` first; if that's not displayed (e.g. user
 * dismissed it three times, or the browser is blocking 3p cookies without
 * FedCM), it falls back to rendering the official GIS button in a hidden host
 * and synthesising a click. That second path always works.
 */
export async function getGoogleIdToken(): Promise<string> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      'Google sign-in is not configured (missing VITE_GOOGLE_CLIENT_ID).',
    );
  }
  await loadScript();
  const id = window.google?.accounts?.id;
  if (!id) throw new Error('Google Identity Services failed to load.');

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    id.initialize({
      client_id: clientId,
      callback: (resp) => {
        if (resp.credential) {
          settle(() => resolve(resp.credential));
        } else {
          settle(() => reject(new Error('Google did not return a credential.')));
        }
      },
      auto_select: false,
      cancel_on_tap_outside: false,
      use_fedcm_for_prompt: true,
      ux_mode: 'popup',
    });

    id.prompt((notification) => {
      // If the One Tap prompt isn't shown, render the official button into a
      // hidden host and click it. This guarantees a popup-based flow.
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        const host = document.createElement('div');
        host.style.position = 'fixed';
        host.style.left = '-10000px';
        host.style.top = '-10000px';
        document.body.appendChild(host);
        try {
          id.renderButton(host, { type: 'standard', theme: 'outline', size: 'large' });
          // GIS renders an inner div[role=button]; click it to start the popup.
          requestAnimationFrame(() => {
            const btn = host.querySelector<HTMLElement>('div[role="button"]');
            if (btn) {
              btn.click();
            } else {
              settle(() => reject(new Error('Google sign-in button failed to render.')));
              host.remove();
            }
          });
        } catch (err) {
          settle(() => reject(err instanceof Error ? err : new Error(String(err))));
          host.remove();
        }
      } else if (notification.isDismissedMoment()) {
        const reason = notification.getDismissedReason();
        if (reason === 'credential_returned') return; // callback will fire
        settle(() => reject(new Error(`Google sign-in dismissed (${reason}).`)));
      }
    });
  });
}
