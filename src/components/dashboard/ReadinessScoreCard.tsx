import type { ReadinessSnapshot } from '@artemis/shared';
import { CheckIcon } from '@/components/ui/icons';

const bandCopy: Record<ReadinessSnapshot['band'], { label: string; line: string; ring: string }> = {
  starter: {
    label: 'Just getting started',
    line: 'Finish the basics to unlock your full readiness picture.',
    ring: 'stroke-rose-400',
  },
  building: {
    label: 'Building',
    line: 'Solid foundation — now sharpen the gaps Artemis flagged.',
    ring: 'stroke-amber-400',
  },
  ready: {
    label: 'Ready to apply',
    line: 'Your profile is in good shape. Tighten the highest-severity gap to push higher.',
    ring: 'stroke-emerald-400',
  },
  strong: {
    label: 'Strong candidate',
    line: 'Your CV signals are strong. Keep tailoring per role.',
    ring: 'stroke-brand-green',
  },
};

interface Props {
  snapshot: ReadinessSnapshot;
}

export function ReadinessScoreCard({ snapshot }: Props) {
  const copy = bandCopy[snapshot.band];
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, snapshot.score)) / 100);

  return (
    <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8">
      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-6 sm:gap-8 items-center">
        <div className="flex items-center justify-center">
          <div className="relative w-[160px] h-[160px]">
            <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90" aria-hidden>
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-gray-100"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                className={copy.ring}
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[34px] font-extrabold text-[#111827] leading-none">
                {snapshot.score}
              </div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-gray-500 mt-1">
                Readiness
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-green">
            Your Artemis score
          </div>
          <h2 className="mt-1 text-[24px] font-extrabold tracking-tight text-[#111827] leading-[1.15]">
            {copy.label}
          </h2>
          <p className="mt-2 text-[14px] text-gray-600 max-w-xl">{copy.line}</p>

          <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {snapshot.factors.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-2 rounded-xl bg-[#fafafa] border border-gray-100 px-3 py-2"
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
                  className={'text-[13px] truncate ' + (f.done ? 'text-gray-700' : 'text-gray-500')}
                >
                  {f.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
