import { useState } from 'react';
import type { BulletPath } from '@artemis/shared';
import { SparklesIcon, SpinnerIcon, CheckIcon } from '@/components/ui/icons';
import {
  useApplyBullet,
  useRewriteTargetedBullet,
} from '@/hooks/useOnboarding';

/**
 * One-click "Fix" affordance for action plan items that quote a specific
 * bullet. Chains POST /cv/.../rewrite → POST /cv/.../apply behind the scenes
 * and exposes a 60-second undo window that restores the original text via
 * the same apply endpoint.
 *
 * States:
 *   idle      → "Fix"          (sparkle icon)
 *   pending   → "Fixing…"      (spinner, disabled)
 *   applied   → "Fixed ✓ Undo" (check + undo link, 60s)
 *   undone    → reverts to idle (so the user can try again)
 *   error     → small red note, button re-enabled
 */
export function FixButton({
  target,
  original,
}: {
  target: BulletPath;
  /** The bullet text we're replacing — captured before we apply so Undo works. */
  original: string;
}) {
  const rewrite = useRewriteTargetedBullet();
  const apply = useApplyBullet();
  const [appliedText, setAppliedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pending = rewrite.isPending || apply.isPending;

  async function handleFix() {
    setError(null);
    try {
      const r = await rewrite.mutateAsync(target);
      // Use the AI's strongest rewrite. The 2 alternatives stay accessible
      // through the longer-form RewriteDrawer if the user wants to compare.
      const next = r.main;
      await apply.mutateAsync({ target, text: next });
      setAppliedText(next);
      // Auto-clear the affordance after a minute so it doesn't linger
      // forever on a quiet page.
      window.setTimeout(() => {
        setAppliedText((cur) => (cur === next ? null : cur));
      }, 60_000);
    } catch {
      setError('Could not auto-apply. Try the manual rewrite.');
    }
  }

  async function handleUndo() {
    if (!appliedText) return;
    setError(null);
    try {
      await apply.mutateAsync({ target, text: original });
      setAppliedText(null);
    } catch {
      setError('Could not undo. Try editing the bullet manually.');
    }
  }

  if (appliedText) {
    return (
      <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-[#15803d]">
        <span className="inline-flex items-center gap-1">
          <CheckIcon className="w-4 h-4" />
          Fixed
        </span>
        <button
          type="button"
          onClick={handleUndo}
          disabled={apply.isPending}
          className="text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline disabled:opacity-50"
        >
          Undo
        </button>
        {error ? <span className="text-rose-600">{error}</span> : null}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleFix}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-full bg-brand-green px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-[#15803d] disabled:opacity-60"
      >
        {pending ? (
          <>
            <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />
            Fixing…
          </>
        ) : (
          <>
            <SparklesIcon className="w-3.5 h-3.5" />
            Fix
          </>
        )}
      </button>
      {error ? (
        <span className="text-[12px] text-rose-600">{error}</span>
      ) : null}
    </span>
  );
}
