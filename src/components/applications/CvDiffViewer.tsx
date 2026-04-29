import type { DiffSegment } from '@artemis/shared';
import { cn } from '@/lib/cn';

/**
 * Renders the word-level diff produced by /applications/:id/target-cv.
 * - op === 1  → addition (green)
 * - op === -1 → removal (red strikethrough)
 * - op === 0  → unchanged
 */
export function CvDiffViewer({ segments }: { segments: DiffSegment[] }) {
  if (!segments.length) {
    return <p className="text-[13px] text-gray-500">No diff to display.</p>;
  }
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
      <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
        Targeted CV — diff
      </div>
      <h2 className="mt-1 text-[20px] font-semibold text-[#111827]">What changed</h2>
      <p className="mt-1 text-[13px] text-gray-500">
        Green text was added, red was removed. Everything else is preserved from your base CV.
      </p>
      <pre className="mt-5 whitespace-pre-wrap break-words font-sans text-[14px] leading-relaxed text-gray-800">
        {segments.map((seg, i) => (
          <span
            key={i}
            className={cn(
              seg.op === 1 && 'bg-emerald-100 text-emerald-900 rounded px-0.5',
              seg.op === -1 && 'bg-rose-100 text-rose-700 line-through rounded px-0.5',
            )}
          >
            {seg.text}
          </span>
        ))}
      </pre>
    </div>
  );
}
