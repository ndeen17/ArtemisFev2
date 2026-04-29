import { useEffect, useState } from 'react';
import type { BulletRewriteResponse } from '@artemis/shared';
import { Button } from '@/components/ui/Button';
import { CopyIcon, SparklesIcon, SpinnerIcon, CheckIcon } from '@/components/ui/icons';
import { useRewriteBullet } from '@/hooks/useProfile';

/**
 * PRF-03 — Three-pane CV bullet rewriter.
 *
 * Left:   the original bullet (editable so the user can refine the input).
 * Middle: the AI's strongest single rewrite.
 * Right:  two alternative rewrites (different angles).
 *
 * Selecting an alternative copies it into the middle pane. Each pane has its own
 * copy-to-clipboard. We deliberately don't write back to the CV here — the rewriter
 * is a coaching surface, not an editor (a full CV editor lands in a later phase).
 */
interface Props {
  initialBullet?: string;
}

export function CVRewriter({ initialBullet = '' }: Props) {
  const [original, setOriginal] = useState(initialBullet);
  const [main, setMain] = useState<string | null>(null);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const rewrite = useRewriteBullet();

  // Reset main/alts whenever the input changes — keeps UI honest.
  useEffect(() => {
    setMain(null);
    setAlternatives([]);
  }, [original]);

  const tooShort = original.trim().length < 8;

  const onRewrite = () => {
    if (tooShort || rewrite.isPending) return;
    rewrite.mutate(original.trim(), {
      onSuccess(data: BulletRewriteResponse) {
        setMain(data.main);
        setAlternatives(data.alternatives);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Pane title="Original" eyebrow="Your bullet" tone="neutral">
          <textarea
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            placeholder="Paste a single CV bullet…"
            className="w-full h-40 resize-none rounded-2xl border border-gray-200 bg-white p-4 text-[14px] text-[#111827] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#dcfce7] focus:border-brand-green"
          />
          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={onRewrite}
              disabled={tooShort || rewrite.isPending}
            >
              {rewrite.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <SpinnerIcon className="animate-spin w-4 h-4" /> Rewriting…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4" /> Rewrite
                </span>
              )}
            </Button>
            {original && <CopyButton text={original} />}
          </div>
          {rewrite.isError && (
            <p className="mt-3 text-[13px] text-rose-600">
              Rewrite failed — try again, or shorten your bullet.
            </p>
          )}
        </Pane>

        <Pane title="AI rewrite" eyebrow="Strongest" tone="brand">
          {main ? (
            <>
              <p className="text-[14px] text-[#111827] leading-relaxed">{main}</p>
              <div className="mt-3">
                <CopyButton text={main} />
              </div>
            </>
          ) : (
            <EmptyHint />
          )}
        </Pane>

        <Pane title="Alternatives" eyebrow="Different angles" tone="neutral">
          {alternatives.length > 0 ? (
            <div className="space-y-3">
              {alternatives.map((alt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMain(alt)}
                  className="block w-full text-left rounded-xl border border-gray-100 bg-[#fafafa] p-3 text-[13px] text-[#111827] leading-relaxed hover:border-brand-green hover:bg-white"
                >
                  {alt}
                </button>
              ))}
              <p className="text-[12px] text-gray-500">Tap an alternative to promote it.</p>
            </div>
          ) : (
            <EmptyHint />
          )}
        </Pane>
      </div>
    </div>
  );
}

function Pane({
  title,
  eyebrow,
  tone,
  children,
}: {
  title: string;
  eyebrow: string;
  tone: 'neutral' | 'brand';
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-3xl border p-5 ${
        tone === 'brand' ? 'border-brand-green/40 bg-[#f6fffa]' : 'border-gray-100 bg-white'
      } shadow-[0_8px_30px_rgba(0,0,0,0.04)]`}
    >
      <div
        className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
          tone === 'brand' ? 'text-[#15803d]' : 'text-gray-500'
        }`}
      >
        {eyebrow}
      </div>
      <h3 className="mt-0.5 text-[15px] font-semibold text-[#111827]">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function EmptyHint() {
  return (
    <p className="text-[13px] text-gray-500">
      Add a bullet on the left and tap <span className="font-semibold text-[#111827]">Rewrite</span>
      .
    </p>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked — silently no-op.
    }
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-600 hover:border-brand-green hover:text-[#15803d]"
    >
      {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
