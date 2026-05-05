import { useEffect, useState } from 'react';
import { useUndoStackStore, UNDO_TTL_MS } from '@/store/undoStackStore';
import { CloseIcon, SpinnerIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';

/**
 * Bottom-right toast host showing the most recent undoable action.
 *
 * Mounted once at the app shell so any flow can call
 * `useUndoStackStore.getState().push({ label, undo })` and get a
 * consistent "Undo" affordance with a 5-minute TTL.
 *
 * Only the newest entry is rendered — older ones are silently retained in
 * the stack until they expire (the user can't act on them once they're
 * scrolled out of view, so showing one at a time keeps the UI calm).
 */
export function UndoToastHost() {
  const entries = useUndoStackStore((s) => s.entries);
  const remove = useUndoStackStore((s) => s.remove);
  const prune = useUndoStackStore((s) => s.prune);
  const latest = entries[entries.length - 1];
  const [running, setRunning] = useState(false);

  // Tick every second to (a) age out expired entries and (b) refresh the
  // small countdown shown next to the Undo link.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!latest) return;
    const handle = window.setInterval(() => {
      setTick((n) => n + 1);
      prune();
    }, 1000);
    return () => window.clearInterval(handle);
  }, [latest, prune]);

  if (!latest) return null;

  const remaining = Math.max(0, UNDO_TTL_MS - (Date.now() - latest.createdAt));
  const minutes = Math.floor(remaining / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  const countdown = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  async function handleUndo() {
    setRunning(true);
    try {
      await latest.undo();
    } finally {
      setRunning(false);
      remove(latest.id);
    }
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-2xl',
        'border border-gray-200 bg-white px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)]',
        'text-[13px] text-gray-800 max-w-[380px]',
      )}
      role="status"
      aria-live="polite"
    >
      <span className="truncate">{latest.label}</span>
      <button
        type="button"
        onClick={handleUndo}
        disabled={running}
        className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-3 py-1 text-[12.5px] font-semibold text-white hover:bg-black disabled:opacity-60"
      >
        {running ? <SpinnerIcon className="w-3.5 h-3.5 animate-spin" /> : null}
        Undo
      </button>
      <span className="text-[11px] tabular-nums text-gray-400">{countdown}</span>
      <button
        type="button"
        onClick={() => remove(latest.id)}
        className="text-gray-400 hover:text-gray-600"
        aria-label="Dismiss"
      >
        <CloseIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
