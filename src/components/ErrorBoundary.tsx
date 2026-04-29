import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Optional fallback render override. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level error boundary. Catches any render-time error in the React tree below it
 * and renders a recovery UI instead of an empty white screen. Phase 9 polish.
 *
 * In production this is the place to forward to Sentry — wire `Sentry.captureException`
 * inside `componentDidCatch` once a DSN is configured.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);
    return (
      <div
        role="alert"
        className="min-h-screen flex items-center justify-center p-6 bg-gray-50"
      >
        <div className="max-w-md rounded-3xl border border-red-100 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-red-600">
            Something went wrong
          </div>
          <h1 className="mt-2 text-[22px] font-extrabold tracking-tight text-[#111827]">
            We hit an unexpected error.
          </h1>
          <p className="mt-3 text-[14px] text-gray-600">
            The page crashed while rendering. You can try again, or reload to start fresh.
          </p>
          <pre className="mt-4 max-h-40 overflow-auto rounded-xl bg-gray-50 p-3 text-[12px] text-gray-700 whitespace-pre-wrap break-words">
            {error.message}
          </pre>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={this.reset}
              className="inline-flex items-center rounded-full bg-brand-green px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#15803d]"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] font-semibold text-[#111827] hover:bg-gray-50"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
