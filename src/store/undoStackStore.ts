import { create } from 'zustand';

/**
 * Global undo stack for one-click "Fix"-style mutations.
 *
 * Any flow that auto-applies a destructive change (replace bullet, rewrite
 * summary, etc.) can `push()` an entry describing how to revert it. The
 * `UndoToastHost` renders the most recent entry as a slim toast and triggers
 * `entry.undo()` when the user clicks "Undo".
 *
 * Entries auto-expire after 5 minutes so the toast doesn't linger forever
 * once the action is "committed" in the user's mind.
 */
const TTL_MS = 5 * 60 * 1000;

export interface UndoEntry {
  id: string;
  /** Short user-facing label, e.g. "Replaced bullet in Acme Corp". */
  label: string;
  /** Called when the user clicks Undo. May be async — host awaits it. */
  undo: () => void | Promise<void>;
  /** Epoch ms when this entry was pushed. */
  createdAt: number;
}

interface UndoStackState {
  entries: UndoEntry[];
  push(entry: Omit<UndoEntry, 'id' | 'createdAt'>): string;
  remove(id: string): void;
  /** Drop entries whose TTL has elapsed. Cheap to call repeatedly. */
  prune(now?: number): void;
}

export const useUndoStackStore = create<UndoStackState>((set, get) => ({
  entries: [],
  push(entry) {
    const id = `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const next: UndoEntry = { ...entry, id, createdAt: Date.now() };
    // Cap to last 5 entries so we don't grow unboundedly across a long
    // session. Older entries are silently dropped — they'd be expired soon
    // anyway and showing >1 in the host already makes the UI noisy.
    set({ entries: [...get().entries, next].slice(-5) });
    return id;
  },
  remove(id) {
    set({ entries: get().entries.filter((e) => e.id !== id) });
  },
  prune(now = Date.now()) {
    const fresh = get().entries.filter((e) => now - e.createdAt < TTL_MS);
    if (fresh.length !== get().entries.length) set({ entries: fresh });
  },
}));

export const UNDO_TTL_MS = TTL_MS;
