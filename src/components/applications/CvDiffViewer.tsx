import type { DiffSegment, DiffReasonCode } from '@artemis/shared';
import { cn } from '@/lib/cn';

/**
 * Renders the word-level diff produced by /applications/:id/target-cv.
 * - op === 1  → addition (green) — annotated with a reason badge when present
 * - op === -1 → removal (red strikethrough)
 * - op === 0  → unchanged
 */

const REASON_STYLES: Record<DiffReasonCode, { label: string; classes: string }> = {
  jd_keyword: { label: 'JD keyword', classes: 'bg-emerald-700 text-white' },
  power_verb: { label: 'Power verb', classes: 'bg-indigo-600 text-white' },
  quantification: { label: 'Metric', classes: 'bg-amber-500 text-white' },
  role_fit: { label: 'Role fit', classes: 'bg-sky-600 text-white' },
  clarity: { label: 'Clarity', classes: 'bg-gray-500 text-white' },
  other: { label: 'Edit', classes: 'bg-gray-400 text-white' },
};

const LEGEND_ORDER: DiffReasonCode[] = [
  'jd_keyword',
  'power_verb',
  'quantification',
  'role_fit',
  'clarity',
];

export function CvDiffViewer({ segments }: { segments: DiffSegment[] }) {
  if (!segments.length) {
    return <p className="text-[13px] text-gray-500">No diff to display.</p>;
  }
  const annotatedCodes = new Set<DiffReasonCode>();
  for (const seg of segments) {
    if (seg.op === 1 && seg.reasonCode) annotatedCodes.add(seg.reasonCode);
  }
  const showLegend = annotatedCodes.size > 0;

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
      <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
        Targeted CV — diff
      </div>
      <h2 className="mt-1 text-[20px] font-semibold text-[#111827]">What changed</h2>
      <p className="mt-1 text-[13px] text-gray-500">
        Green text was added, red was removed. Hover an addition to see why.
      </p>
      {showLegend && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="font-semibold uppercase tracking-[0.12em] text-gray-500">
            Reasons
          </span>
          {LEGEND_ORDER.filter((c) => annotatedCodes.has(c)).map((code) => (
            <span
              key={code}
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 font-semibold',
                REASON_STYLES[code].classes,
              )}
            >
              {REASON_STYLES[code].label}
            </span>
          ))}
        </div>
      )}
      <pre className="mt-5 whitespace-pre-wrap break-words font-sans text-[14px] leading-relaxed text-gray-800">
        {segments.map((seg, i) => {
          if (seg.op === 1 && seg.reasonCode) {
            const style = REASON_STYLES[seg.reasonCode];
            return (
              <span
                key={i}
                title={seg.reason ?? style.label}
                className="rounded px-0.5 bg-emerald-100 text-emerald-900"
              >
                {seg.text}
                <span
                  aria-hidden
                  className={cn(
                    'ml-1 hidden sm:inline-flex items-center rounded-full px-1.5 py-[1px] text-[10px] font-semibold align-middle',
                    style.classes,
                  )}
                >
                  {style.label}
                </span>
              </span>
            );
          }
          return (
            <span
              key={i}
              className={cn(
                seg.op === 1 && 'bg-emerald-100 text-emerald-900 rounded px-0.5',
                seg.op === -1 && 'bg-rose-100 text-rose-700 line-through rounded px-0.5',
              )}
            >
              {seg.text}
            </span>
          );
        })}
      </pre>
    </div>
  );
}
