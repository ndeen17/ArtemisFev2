import { useCallback, useEffect } from 'react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { useBuilderDirty } from '@/store/builderDirtyStore';

/**
 * Two-pane layout primitive used by the profile and targeted-CV review pages
 * for inline editing.
 *
 * Behaviour:
 *   - When `open` is false, only `left` is rendered (full width).
 *   - When `open` is true on xl+ screens (≥1280px), the layout becomes a
 *     2-column grid: left content (1fr) + builder (1.4fr).
 *   - Below xl, the builder slides over the page as a full-screen sheet.
 *   - Esc closes the builder via `onClose`.
 *   - When the builder reports unsaved changes (via `useBuilderDirty`), the
 *     header shows an "Unsaved" pill and Close / Esc / page-unload all
 *     prompt for confirmation before discarding.
 *
 * The builder pane scrolls independently and pins a header with a Close button.
 */
export function SplitPaneShell({
  open,
  onClose,
  left,
  right,
  rightTitle,
  rightSubtitle,
  onPreview,
}: {
  open: boolean;
  onClose: () => void;
  left: React.ReactNode;
  right: React.ReactNode;
  rightTitle: string;
  rightSubtitle?: string;
  /** Optional Preview action surfaced in the header next to Close. Hosts wire
   *  this to a navigate() so the action is impossible to miss. */
  onPreview?: () => void;
}) {
  const dirty = useBuilderDirty((s) => s.dirty);

  // Wrap onClose so any caller-provided handler (header button, Esc) goes
  // through the same confirmation gate when there are unsaved edits.
  const guardedClose = useCallback(() => {
    if (dirty) {
      const ok = window.confirm(
        'You have unsaved changes in the builder. Discard them and close?',
      );
      if (!ok) return;
    }
    onClose();
  }, [dirty, onClose]);

  useEffect(() => {
    if (!open) return;
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') guardedClose();
    }
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, guardedClose]);

  // Browser-level guard: if the user reloads / closes the tab while there
  // are unsaved edits in the builder, give them the standard "Leave site?"
  // prompt. This is independent of the in-app Close confirmation.
  useEffect(() => {
    if (!open || !dirty) return;
    function handle(e: BeforeUnloadEvent) {
      e.preventDefault();
      // Modern browsers ignore the message string but still need this set.
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', handle);
    return () => window.removeEventListener('beforeunload', handle);
  }, [open, dirty]);

  // Lock body scroll when the builder is open on small screens to prevent
  // the underlying page from scrolling behind the sheet.
  useEffect(() => {
    if (!open) return;
    if (typeof document === 'undefined') return;
    const isSmall = window.matchMedia('(max-width: 1279.98px)').matches;
    if (!isSmall) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div
      className={cn(
        'grid gap-6 grid-cols-1',
        // On xl+ keep the left column (action plan, etc.) visible alongside
        // the builder so the user can keep scanning their plan while editing.
        // The builder gets the larger 1.4fr share but never the full breadth.
        open ? 'xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]' : '',
      )}
    >
      <div className="min-w-0">{left}</div>
      {open ? (
        <aside
          className={cn(
            'min-w-0',
            // Below xl: full-screen sheet over the page.
            'fixed inset-0 z-40 bg-[#fafafa]',
            // xl+: in-flow, full width of the AppShell content area.
            'xl:static xl:bg-transparent',
          )}
          aria-label={rightTitle}
        >
          <div className="flex h-full flex-col xl:h-auto xl:rounded-3xl xl:border xl:border-gray-100 xl:bg-white xl:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3 sm:px-6 xl:rounded-t-3xl">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
                    Builder
                  </div>
                  {dirty ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-amber-700"
                      title="You have unsaved changes"
                    >
                      <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Unsaved
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-0.5 truncate text-[16px] font-semibold text-[#111827]">
                  {rightTitle}
                </h2>
                {rightSubtitle ? (
                  <p className="mt-0.5 truncate text-[12px] text-gray-500">{rightSubtitle}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {onPreview ? (
                  <Button
                    variant="outline"
                    onClick={onPreview}
                    aria-label="Preview CV"
                    title="See the printable version of your CV"
                  >
                    Preview
                  </Button>
                ) : null}
                <Button variant="ghost" onClick={guardedClose} aria-label="Close builder">
                  Close
                </Button>
              </div>
            </header>
            {/* Below xl this scroller carries the sheet content. On xl+ we
                rely on the page's own scroll so the editor flows to its full
                vertical length next to the action plan, never capped at the
                viewport height. */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 xl:flex-none xl:overflow-visible">
              {right}
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
