import { useState } from 'react';
import type { BulletPath } from '@artemis/shared';
import { Button } from '@/components/ui/Button';
import { CopyIcon, SparklesIcon, SpinnerIcon, CheckIcon } from '@/components/ui/icons';
import {
  useRewriteTargetedBullet,
  useApplyBullet,
} from '@/hooks/useOnboarding';

/**
 * Drawer-style targeted rewrite: opens with a known {cvId, expId, bulletIdx},
 * fetches main + 2 alternatives from POST /cv/.../rewrite, and lets the user
 * Apply any of them. Apply persists via POST /cv/.../apply (which goes through
 * cv.service.updateStructured → analysis re-queue → rubric re-score).
 *
 * `onApplied(text)` lets a parent (e.g. CvEditor) sync its local draft so the
 * just-applied text isn't wiped by a subsequent save.
 */
export function RewriteDrawer({
  target,
  initialOriginal,
  onApplied,
  onClose,
}: {
  target: BulletPath;
  initialOriginal?: string;
  onApplied?: (text: string) => void;
  onClose: () => void;
}) {
  const rewrite = useRewriteTargetedBullet();
  const apply = useApplyBullet();
  const [original, setOriginal] = useState<string>(initialOriginal ?? '');
  const [main, setMain] = useState<string | null>(null);
  const [alts, setAlts] = useState<string[]>([]);
  const [appliedText, setAppliedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoStarted, setAutoStarted] = useState(false);

  // Auto-fire one rewrite as soon as the drawer mounts with a target — saves a click.
  if (!autoStarted) {
    setAutoStarted(true);
    rewrite.mutate(target, {
      onSuccess(data) {
        setOriginal(data.original);
        setMain(data.main);
        setAlts(data.alternatives);
      },
      onError() {
        setError('Could not generate a rewrite. Try again.');
      },
    });
  }

  function handleApply(text: string) {
    setError(null);
    apply.mutate(
      { target, text },
      {
        onSuccess() {
          setAppliedText(text);
          onApplied?.(text);
        },
        onError() {
          setError('Could not save the rewrite. Try again.');
        },
      },
    );
  }

  return (
    <div role="dialog" aria-label="Rewrite bullet" className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative ml-auto h-full w-full max-w-[640px] bg-white shadow-2xl flex flex-col">
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
              Rewrite bullet
            </div>
            <h2 className="mt-1 text-[16px] font-semibold text-[#111827]">
              Sharper, action-led, quantified
            </h2>
            <p className="mt-1 text-[12.5px] text-gray-500">
              Apply lands directly in your CV and re-runs analysis automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <Pane title="Original" eyebrow="Your bullet">
            {rewrite.isPending && !original ? (
              <Loading />
            ) : (
              <p className="text-[13.5px] text-[#111827] leading-relaxed whitespace-pre-wrap">
                {original || '(loading…)'}
              </p>
            )}
          </Pane>

          <Pane title="Strongest rewrite" eyebrow="Recommended" tone="brand">
            {rewrite.isPending && !main ? (
              <Loading />
            ) : main ? (
              <>
                <p className="text-[14px] text-[#111827] leading-relaxed whitespace-pre-wrap">
                  {main}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApply(main)}
                    disabled={apply.isPending}
                  >
                    {appliedText === main ? (
                      <span className="inline-flex items-center gap-2">
                        <CheckIcon className="w-4 h-4" /> Applied
                      </span>
                    ) : apply.isPending ? (
                      <span className="inline-flex items-center gap-2">
                        <SpinnerIcon className="animate-spin w-4 h-4" /> Saving…
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4" /> Apply to my CV
                      </span>
                    )}
                  </Button>
                  <CopyButton text={main} />
                </div>
              </>
            ) : (
              <p className="text-[13px] text-gray-500">No rewrite yet.</p>
            )}
          </Pane>

          {alts.length > 0 ? (
            <Pane title="Alternatives" eyebrow="Different angles">
              <div className="space-y-3">
                {alts.map((alt, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-gray-100 bg-[#fafafa] p-3"
                  >
                    <p className="text-[13px] text-[#111827] leading-relaxed whitespace-pre-wrap">
                      {alt}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApply(alt)}
                        disabled={apply.isPending}
                        className="text-[12px] font-semibold text-[#15803d] hover:underline disabled:opacity-50"
                      >
                        {appliedText === alt ? 'Applied ✓' : 'Apply this version'}
                      </button>
                      <CopyButton text={alt} />
                    </div>
                  </div>
                ))}
              </div>
            </Pane>
          ) : null}

          {error ? <p className="text-[13px] text-rose-600">{error}</p> : null}
        </div>

        <footer className="border-t border-gray-100 px-5 py-3 flex justify-between items-center text-[12px] text-gray-500">
          <span>
            {appliedText
              ? 'Applied — re-analysis is running in the background.'
              : 'Pick a version, then Apply.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-semibold text-gray-700 hover:text-gray-900"
          >
            {appliedText ? 'Done' : 'Cancel'}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Pane({
  title,
  eyebrow,
  tone = 'neutral',
  children,
}: {
  title: string;
  eyebrow: string;
  tone?: 'neutral' | 'brand';
  children: React.ReactNode;
}) {
  return (
    <section
      className={
        tone === 'brand'
          ? 'rounded-2xl border border-brand-green/30 bg-brand-green/5 p-4'
          : 'rounded-2xl border border-gray-100 bg-white p-4'
      }
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-green">
        {eyebrow}
      </div>
      <div className="text-[12.5px] font-semibold text-gray-700 mb-2">{title}</div>
      {children}
    </section>
  );
}

function Loading() {
  return (
    <div className="flex items-center gap-2 text-[13px] text-gray-500">
      <SpinnerIcon className="animate-spin w-4 h-4" /> Rewriting…
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1 text-[12px] font-semibold text-gray-600 hover:text-gray-900"
    >
      {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
