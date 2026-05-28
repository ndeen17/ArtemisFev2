import type { ReadinessSnapshot } from '@artemis/shared';

/**
 * Setup progress card — dashboard-only.
 *
 * Surfaces the onboarding/setup completion that `deriveReadiness()` tracks,
 * NOT the resume readiness score (that lives in `ResumeReadinessCard`).
 *
 * UX rules:
 *  - Hides entirely at 100%. Once setup is done, it's a chore that's behind
 *    the user — no permanent trophy card.
 *  - Only the **remaining** factors are listed. The done ones are summed in
 *    the "X / Y" counter; surfacing them as ticked rows just added noise.
 *  - Single horizontal bar, band-coloured at `-500` saturation to match the
 *    global severity palette established in the Profile UI quick-wins.
 */
const BAND_COPY: Record<
  ReadinessSnapshot['band'],
  { label: string; line: string; bar: string }
> = {
  starter: {
    label: 'Just getting started',
    line: 'Knock these out to unlock the full Artemis experience.',
    bar: 'bg-rose-500',
  },
  building: {
    label: 'Setup underway',
    line: 'A few more boxes to tick before you’re fully set up.',
    bar: 'bg-amber-500',
  },
  ready: {
    label: 'Setup nearly complete',
    line: 'One or two more items and you’re fully set up.',
    bar: 'bg-emerald-500',
  },
  strong: {
    // Unused at runtime — we return null when fully set up — kept for type
    // exhaustiveness in case a future state lands here.
    label: 'Fully set up',
    line: '',
    bar: 'bg-brand-green',
  },
};

interface Props {
  snapshot: ReadinessSnapshot;
}

export function SetupProgressCard({ snapshot }: Props) {
  const score = Math.max(0, Math.min(100, snapshot.score));

  // Disappear entirely once setup is complete — no trophy card.
  if (score >= 100) return null;

  const copy = BAND_COPY[snapshot.band];
  const remaining = snapshot.factors.filter((f) => !f.done);
  const total = snapshot.factors.length;
  const done = total - remaining.length;

  return (
    <section className="rounded-3xl border border-gray-100 bg-white shadow-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Setup progress
          </div>
          <h2 className="mt-1 text-[18px] sm:text-[20px] font-semibold text-ink">
            {copy.label}
          </h2>
          <p className="mt-1 text-[13px] text-ink-muted max-w-xl">{copy.line}</p>
        </div>
        <div className="text-right">
          <div className="text-[22px] font-extrabold tabular-nums text-ink leading-none">
            {done}
            <span className="text-[14px] font-semibold text-gray-400"> / {total}</span>
          </div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-ink-muted mt-1">
            Steps done
          </div>
        </div>
      </div>

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

      {/* Only the remaining items — completed ones disappear so the user
          isn't reading rows of green checks for things they already did. */}
      {remaining.length > 0 ? (
        <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {remaining.map((f) => (
            <li
              key={f.id}
              className="flex items-start gap-2 rounded-xl bg-surface-muted border border-gray-100 px-3 py-2 min-w-0"
            >
              <span
                className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gray-400"
                aria-hidden
              />
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-ink truncate">
                  {f.label}
                </div>
                {f.hint ? (
                  <div className="text-[12px] text-ink-muted truncate">{f.hint}</div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
