import { Link } from 'react-router-dom';
import type { ProfileOverview } from '@artemis/shared';
import { ArrowRightIcon, SpinnerIcon } from '@/components/ui/icons';

/**
 * Dashboard primary score card. Shows the **same** readiness percentage as
 * the Profile page (`overview.readinessScore`) so users see one consistent
 * number across the app instead of two competing values.
 *
 * Sister component to `ProfileOverviewCard` on the profile page — the score
 * is identical; only the framing copy differs because the dashboard is the
 * "where am I right now" surface, not the deep-dive.
 */
interface Props {
  overview: ProfileOverview | undefined;
  isLoading: boolean;
}

const bandCopy = (score: number | null) => {
  if (score === null) {
    return {
      label: 'No score yet',
      line: 'Add a CV from your resume to get your readiness score.',
      ring: 'stroke-gray-300',
    };
  }
  if (score >= 85) {
    return {
      label: 'Strong candidate',
      line: 'Your CV signals are strong. Keep tailoring per role.',
      ring: 'stroke-brand-green',
    };
  }
  if (score >= 65) {
    return {
      label: 'Ready to apply',
      line: 'Solid resume. Tighten the highest-severity gap to push higher.',
      ring: 'stroke-emerald-400',
    };
  }
  if (score >= 35) {
    return {
      label: 'Building',
      line: 'Foundation is there — sharpen the gaps Artemis flagged.',
      ring: 'stroke-amber-400',
    };
  }
  return {
    label: 'Just getting started',
    line: 'Polish your CV from your resume to unlock your full picture.',
    ring: 'stroke-rose-400',
  };
};

export function ProfileScoreCard({ overview, isLoading }: Props) {
  if (isLoading || !overview) {
    return (
      <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8">
        <div className="flex items-center gap-2 text-[14px] text-gray-500">
          <SpinnerIcon className="animate-spin" /> Loading your readiness score…
        </div>
      </section>
    );
  }

  const score = overview.readinessScore;
  const display = score ?? 0;
  const copy = bandCopy(score);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, display)) / 100);
  const delta = overview.weeklyDelta;

  return (
    <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8">
      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-6 sm:gap-8 items-center">
        <div className="flex items-center justify-center">
          <div className="relative w-[140px] h-[140px] sm:w-[160px] sm:h-[160px]">
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
              <div className="text-[32px] sm:text-[34px] font-extrabold text-[#111827] leading-none tabular-nums">
                {score === null ? '—' : score}
              </div>
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-gray-500 mt-1">
                Readiness
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-green">
            Resume readiness
          </div>
          <h2 className="mt-1 text-[22px] sm:text-[24px] font-extrabold tracking-tight text-[#111827] leading-[1.15]">
            {copy.label}
          </h2>
          <p className="mt-2 text-[14px] text-gray-600 max-w-xl">{copy.line}</p>
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            {typeof delta === 'number' && delta !== 0 ? (
              <span
                className={
                  'inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold ' +
                  (delta > 0
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200')
                }
              >
                {delta > 0 ? '+' : ''}
                {delta} since last
              </span>
            ) : null}
            <Link
              to="/profile"
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#15803d] hover:underline"
            >
              See breakdown <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
