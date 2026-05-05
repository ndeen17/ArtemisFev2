import { useEffect } from 'react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';

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
}: {
  open: boolean;
  onClose: () => void;
  left: React.ReactNode;
  right: React.ReactNode;
  rightTitle: string;
  rightSubtitle?: string;
}) {
  useEffect(() => {
    if (!open) return;
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, onClose]);

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
        open ? 'xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]' : '',
      )}
    >
      <div className="min-w-0">{left}</div>
      {open ? (
        <aside
          className={cn(
            'min-w-0',
            'fixed inset-0 z-40 bg-[#fafafa]',
            'xl:static xl:bg-transparent xl:sticky xl:top-4 xl:z-auto',
          )}
          aria-label={rightTitle}
        >
          <div className="flex h-full flex-col xl:max-h-[calc(100vh-2rem)] xl:rounded-3xl xl:border xl:border-gray-100 xl:bg-white xl:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3 sm:px-6 xl:rounded-t-3xl">
              <div className="min-w-0">
                <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
                  Builder
                </div>
                <h2 className="mt-0.5 truncate text-[16px] font-semibold text-[#111827]">
                  {rightTitle}
                </h2>
                {rightSubtitle ? (
                  <p className="mt-0.5 truncate text-[12px] text-gray-500">{rightSubtitle}</p>
                ) : null}
              </div>
              <Button variant="ghost" onClick={onClose} aria-label="Close builder">
                Close
              </Button>
            </header>
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">{right}</div>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
