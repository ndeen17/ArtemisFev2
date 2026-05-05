import { create } from 'zustand';

/**
 * Tiny shared signal between `BuilderPanel` (which knows whether the user has
 * uncommitted edits) and `SplitPaneShell` (which owns the Close button and
 * Esc handler). Lifting it out of either component means we don't have to
 * thread props through the host pages.
 *
 * Lifecycle:
 *   - BuilderPanel calls `setDirty(true)` whenever the working draft diverges
 *     from the last server snapshot, and `setDirty(false)` after a successful
 *     save / on unmount.
 *   - SplitPaneShell reads `dirty` to (a) show an "Unsaved" pill in the
 *     header and (b) confirm before closing or before the user navigates away.
 */
interface BuilderDirtyState {
  dirty: boolean;
  setDirty: (next: boolean) => void;
}

export const useBuilderDirty = create<BuilderDirtyState>((set) => ({
  dirty: false,
  setDirty: (dirty) => set({ dirty }),
}));
