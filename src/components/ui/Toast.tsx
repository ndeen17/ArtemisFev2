import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ToastTone = 'info' | 'success' | 'error';

export interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  /** Auto-dismiss after this many ms. Default 5000. Pass 0 to keep until dismissed. */
  durationMs?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Lightweight in-house toast system. Phase 9 polish — gives the FE a single
 * call-site (`useToast().push({...})`) for transient notifications instead of
 * inline alert banners scattered through pages.
 */
export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const toast: Toast = { id, ...t };
      setToasts((prev) => [...prev, toast]);
      const duration = toast.durationMs ?? 5000;
      if (duration > 0) {
        const handle = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, handle);
      }
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}): JSX.Element {
  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

const TONE_STYLES: Record<ToastTone, string> = {
  info: 'border-gray-200 bg-white text-[#111827]',
  success: 'border-[#dcfce7] bg-[#f0fdf4] text-[#15803d]',
  error: 'border-red-100 bg-red-50 text-red-700',
};

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }): JSX.Element {
  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className={
        'pointer-events-auto rounded-2xl border px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)] ' +
        TONE_STYLES[toast.tone]
      }
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold">{toast.title}</div>
          {toast.description ? (
            <div className="mt-0.5 text-[13px] opacity-80">{toast.description}</div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="flex-shrink-0 text-[12px] font-semibold uppercase tracking-wide opacity-60 hover:opacity-100"
          aria-label="Dismiss notification"
        >
          Close
        </button>
      </div>
    </div>
  );
}
