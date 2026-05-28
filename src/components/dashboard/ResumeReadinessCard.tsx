import { Link } from 'react-router-dom';
import type { ProfileOverview } from '@artemis/shared';
import {
  ArrowRightIcon,
  SpinnerIcon,
  SparklesIcon,
  TrendUpIcon,
  TrendDownIcon,
} from '@/components/ui/icons';
import { scoreBandClasses } from '@/lib/scoreBand';

/**
 * Compact dashboard mirror of the Profile readiness hero.
 *
 * UX intent:
 *  - One number, not two. The dashboard surfaces the SAME `readinessScore` the
 *    profile page shows in its hero — no ring, no per-component breakdown.
 *    That deep view lives on `/profile`; this card is just a homepage signal.
 *  - One CTA only. The page hero already owns the primary CTA, so this card
 *    offers a quiet "See breakdown" text link, never a second primary button.
 *  - States: no-cv → soft empty prompt | done → number + band line + delta.
 *    The analysing state is owned by `AnalysingResumeCard` at the page level.
 */
interface Props {
  overview: ProfileOverview | undefined;
  isLoading: boolean;
  hasCv: boolean;
}

const BAND_COPY: Record<
  ReturnType<typeof tier>,
  { label: string; line: string }
> = {
  strong: {
    label: 'Strong candidate',
    line: 'Your CV signals are strong. Keep tailoring per role.',
  },
  ready: {
    label: 'Ready to apply',
    line: 'Solid resume. Tighten the highest-severity gap to push higher.',
  },
  building: {
    label: 'Building',
    line: 'Foundation is there — sharpen the gaps Artemis flagged.',
  },
  starting: {
    label: 'Just getting started',
    line: 'Polish your CV from your resume to unlock your full picture.',
  },
  none: {
    label: 'No score yet',
    line: 'Add a CV so Artemis can grade your readiness.',
  },
};

function tier(score: number | null | undefined): 'strong' | 'ready' | 'building' | 'starting' | 'none' {
  if (score === null || score === undefined) return 'none';
  if (score >= 85) return 'strong';
  if (score >= 65) return 'ready';
  if (score >= 35) return 'building';
  return 'starting';
}

export function ResumeReadinessCard({ overview, isLoading, hasCv }: Props) {
  if (isLoading || !overview) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-[14px] text-ink-muted">
          <SpinnerIcon className="animate-spin" /> Loading your readiness score…
        </div>
      </Card>
    );
  }

  // First-run empty state. The page hero already has the "Add my CV" CTA via
  // goal copy, so this card just frames the gap and stays out of the way.
  if (!hasCv) {
    return (
      <Card>
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex shrink-0 w-11 h-11 rounded-2xl bg-brand-greenSoft text-brand-greenInk items-center justify-center">
            <SparklesIcon />
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-green">
              Resume readiness
            </div>
            <h2 className="mt-1 text-[20px] font-semibold text-ink">
              Add a CV to unlock your score
            </h2>
            <p className="mt-1 text-[14px] text-ink-muted max-w-xl">
              Artemis grades your CV against ATS checks and recruiter signals.
              Once you upload or build one, your readiness score appears here.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const score = overview.readinessScore;
  const band = scoreBandClasses(score);
  const copy = BAND_COPY[tier(score)];
  const delta = overview.weeklyDelta;

  return (
    <Card>
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 sm:gap-7 items-center">
        {/* Number — same visual weight as Profile hero, slightly smaller so
            the page hero ("Hi, {firstName}.") still wins the page. */}
        <div className="flex items-baseline gap-2">
          <span className="text-[56px] sm:text-[64px] font-extrabold tracking-tight text-ink leading-none tabular-nums">
            {score === null ? '—' : score}
          </span>
          <span className="text-[16px] font-semibold text-gray-400">/ 100</span>
        </div>

        <div className="min-w-0">
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-green">
            Resume readiness
          </div>
          <h2 className="mt-1 text-[20px] sm:text-[22px] font-extrabold tracking-tight text-ink leading-[1.15]">
            {copy.label}
          </h2>
          <p className="mt-1.5 text-[14px] text-ink-muted max-w-xl">{copy.line}</p>
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <DeltaChip delta={delta} />
            <Link
              to="/profile"
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-greenInk hover:underline"
            >
              See breakdown <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Slim band-coloured bar so the score's tier is legible at a glance
          without the visual weight of a full ring. */}
      {score !== null ? (
        <div className="mt-5 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ${band.fill}`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
      ) : null}
    </Card>
  );
}

function DeltaChip({ delta }: { delta: number | null }) {
  if (delta === null || delta === 0) return null;
  const positive = delta > 0;
  return (
    <span
      className={
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ' +
        (positive
          ? 'bg-brand-greenSoft text-brand-greenInk ring-emerald-200'
          : 'bg-rose-50 text-rose-700 ring-rose-200')
      }
      title="Change since your last analysis"
    >
      {positive ? <TrendUpIcon className="w-3 h-3" /> : <TrendDownIcon className="w-3 h-3" />}
      {positive ? '+' : ''}
      {delta} since last
    </span>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white shadow-card p-6 sm:p-8">
      {children}
    </section>
  );
}
