import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { RefineHistoryEntry } from '@artemis/shared';

/**
 * Per-application refine-chatbot conversation thread.
 *
 * The refinement flow is stateless on the backend — every request carries the
 * full rolling history. We persist that history client-side, keyed by
 * application id, so closing the drawer (or reloading the page) keeps the
 * thread intact. Cleared explicitly via the drawer's "Reset conversation"
 * link.
 *
 * Cap is enforced both here and in the BE schema (max 40 entries).
 */
const MAX_HISTORY = 40;

interface RefineChatThread {
  history: RefineHistoryEntry[];
  /** Whether the AI has already opened the conversation. Lets us auto-fire
   *  the very first turn only once per application. */
  bootstrapped: boolean;
}

interface RefineChatStoreState {
  threads: Record<string, RefineChatThread>;
  getThread(appId: string): RefineChatThread;
  appendEntry(appId: string, entry: RefineHistoryEntry): void;
  markBootstrapped(appId: string): void;
  clear(appId: string): void;
}

const emptyThread: RefineChatThread = { history: [], bootstrapped: false };

export const useRefineChatStore = create<RefineChatStoreState>()(
  persist(
    (set, get) => ({
      threads: {},
      getThread(appId) {
        return get().threads[appId] ?? emptyThread;
      },
      appendEntry(appId, entry) {
        set((state) => {
          const current = state.threads[appId] ?? emptyThread;
          const next = [...current.history, entry].slice(-MAX_HISTORY);
          return {
            threads: {
              ...state.threads,
              [appId]: { ...current, history: next },
            },
          };
        });
      },
      markBootstrapped(appId) {
        set((state) => {
          const current = state.threads[appId] ?? emptyThread;
          if (current.bootstrapped) return state;
          return {
            threads: {
              ...state.threads,
              [appId]: { ...current, bootstrapped: true },
            },
          };
        });
      },
      clear(appId) {
        set((state) => {
          const next = { ...state.threads };
          delete next[appId];
          return { threads: next };
        });
      },
    }),
    {
      name: 'artemis.refineChat',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
