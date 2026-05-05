import type { ReadinessSnapshot } from '@artemis/shared';
import { CheckIcon } from '@/components/ui/icons';

/**
 * Setup progress card.
 *
 * Previously rendered as a big "Readiness" ring on the dashboard, which was
 * confusing because the Profile page also shows a "Profile readiness" score
 * (the actual CV quality grade). This card now reflects what it always
 * really tracked: how much of the initial setup the user has completed
 * (profile, CV upload, analysis, etc.). Rendered as a thin horizontal
 * progress bar with a checklist of the contributing factors.
 *
 * Driven by `deriveReadiness()` from the shared domain so the same numbers
 * keep flowing — only the UI framing has changed.
 */
const bandCopy: Record<ReadinessSnapshot['band'], { label: string; line: string; bar: string }> = {
  starter: {
    label: 'Just getting started',
    line: 'Finish the basics below to unlock your full Artemis experience.',
    bar: 'bg-rose-400',
  },
  building: {
    label: 'Setup underway',
    line: 'Almost there — knock out the remaining items below.',
    bar: 'bg-amber-400',
  },
  ready: {
    label: 'Setup nearly complete',
    line: 'One or two more boxes to tick and you’re fully set up.',
    bar: 'bg-emerald-400',
  },
  strong: {
    label: 'Fully set up',
    line: 'Everything’s configured. Focus on improving your CV from your profile.',
    bar: 'bg-brand-green',
  },
};

interface Props {
  snapshot: ReadinessSnapshot;
}

export function SetupProgressCard({ snapshot }: Props) {
  const copy = bandCopy[snapshot.band];
  const score = Math.max(0, Math.min(100, snapshot.score));

  return (
    <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            Setup progress
          </div>
          <h2 className="mt-1 text-[18px] sm:text-[20px] font-semibold text-[#111827]">
            {copy.label}
          </h2>
          <p className="mt-1 text-[13px] text-gray-600 max-w-xl">{copy.line}</p>
        </div>
        <div className="text-right">
          <div className="text-[24px] font-extrabold tabular-nums text-[#111827] leading-none">
            {score}
            <span className="text-[14px] font-semibold text-gray-400">%</span>
          </div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-gray-500 mt-1">
            Complete
          </div>
        </div>
      </div>

      {/* Horizontal "loading bar" style indicator. Replaces the old ring so
          users don't confuse it with the Profile readiness score. */}
      <div
        className="mt-4 h-2 w-full rounded-full bg-gray-100 overflow-hidden"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Setup progress"
      >
        <div
          className={`h-full ${copy.bar} transition-[width] duration-500 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>

      <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {snapshot.factors.map((f) => (
          <li
            key={f.id}
            className="flex items-center gap-2 rounded-xl bg-[#fafafa] border border-gray-100 px-3 py-2 min-w-0"
          >
            <span
              className={
                'flex-shrink-0 inline-flex items-center justify-center rounded-full w-5 h-5 ' +
                (f.done ? 'bg-[#dcfce7]' : 'bg-gray-100')
              }
              aria-label={f.done ? 'Complete' : 'Not yet complete'}
            >
              {f.done ? (
                <CheckIcon className="w-3.5 h-3.5" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              )}
            </span>
            <span
              className={
                'text-[13px] truncate ' + (f.done ? 'text-gray-700' : 'text-gray-500')
              }
            >
              {f.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
