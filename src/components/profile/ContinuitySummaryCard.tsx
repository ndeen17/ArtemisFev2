import type { ContinuitySummary, FindingChange } from '@artemis/shared';
import { scoreLabel } from '@artemis/shared';
import {
  CheckIcon,
  PlusIcon,
  AlertTriangleIcon,
  SparklesIcon,
  SpinnerIcon,
} from '@/components/ui/icons';

/**
 * "Since last time" continuity card (Section C). Reads the {@link ContinuitySummary}
 * the backend derives by diffing the user's two most recent analyses and tells
 * the user, in plain language, what they fixed, what's still open, and what's
 * newly surfaced — plus how the score moved.
 *
 * First-timers (one or zero analyses) get a friendly forward-looking empty
 * state instead of an awkward all-zeros readout.
 */
export function ContinuitySummaryCard({
  continuity,
  isLoading,
}: {
  continuity: ContinuitySummary | undefined;
  isLoading: boolean;
}) {
  if (isLoading || !continuity) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-[14px] text-gray-500">
          <SpinnerIcon className="animate-spin" /> Loading your progress…
        </div>
      </Card>
    );
  }

  if (!continuity.hasPrevious) {
    return (
      <Card>
        <Header />
        <div className="mt-3 flex items-start gap-3 text-[14px] text-gray-500">
          <SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
          <p>
            This is your baseline. Make a few improvements and re-run the analysis —
            next time we’ll show you exactly what you fixed and how your score moved.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <Header />
        <ScoreDeltaPill delta={continuity.scoreDelta} current={continuity.currentScore} />
      </div>

      <BandTransition delta={continuity.scoreDelta} current={continuity.currentScore} />

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Fixed" value={continuity.resolvedCount} tone="emerald" />
        <Stat label="Still open" value={continuity.openCount} tone="amber" />
        <Stat label="New" value={continuity.newCount} tone="violet" />
      </div>

      {continuity.resolved.length > 0 && (
        <FindingGroup
          title="You fixed"
          findings={continuity.resolved}
          icon={<CheckIcon className="h-4 w-4 text-emerald-600" />}
        />
      )}

      {continuity.new.length > 0 && (
        <FindingGroup
          title="Newly surfaced"
          findings={continuity.new}
          icon={<PlusIcon className="h-4 w-4 text-violet-600" />}
        />
      )}

      {continuity.persisting.length > 0 && (
        <FindingGroup
          title="Still to do"
          findings={continuity.persisting}
          icon={<AlertTriangleIcon className="h-4 w-4 text-amber-600" />}
        />
      )}
    </Card>
  );
}

function Header() {
  return (
    <div>
      <h2 className="text-[15px] font-semibold text-gray-900">Since last time</h2>
      <p className="text-[12px] text-gray-400">What’s changed since your previous analysis</p>
    </div>
  );
}

function ScoreDeltaPill({ delta, current }: { delta: number | null; current: number | null }) {
  if (delta === null) return null;
  const up = delta > 0;
  const flat = delta === 0;
  const tone = flat
    ? 'bg-gray-100 text-gray-600'
    : up
      ? 'bg-emerald-50 text-emerald-700'
      : 'bg-rose-50 text-rose-700';
  const sign = up ? '+' : '';
  return (
    <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${tone}`}>
      <span className="text-[15px] font-semibold tabular-nums">
        {flat ? 'No change' : `${sign}${delta}`}
      </span>
      {current !== null && (
        <span className="text-[12px] opacity-70 tabular-nums">now {current}</span>
      )}
    </div>
  );
}

/**
 * "Developing → Solid" band movement line. Only renders when we can resolve
 * both bands (current score known + a delta to derive the previous score) and
 * the band actually changed — otherwise the numeric pill already says it all.
 */
function BandTransition({ delta, current }: { delta: number | null; current: number | null }) {
  if (current === null || delta === null) return null;
  const currentBand = scoreLabel(current);
  const previousBand = scoreLabel(current - delta);
  if (previousBand.band === currentBand.band) return null;
  const improved = delta > 0;
  return (
    <p className="mt-3 text-[13px] text-gray-500">
      You moved from{' '}
      <span className="font-medium text-gray-700">{previousBand.label}</span>
      {' '}
      <span aria-hidden>→</span>{' '}
      <span className={`font-semibold ${improved ? 'text-emerald-700' : 'text-rose-600'}`}>
        {currentBand.label}
      </span>
      .
    </p>
  );
}

const STAT_TONE: Record<'emerald' | 'amber' | 'violet', string> = {
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  violet: 'bg-violet-50 text-violet-700',
};

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'emerald' | 'amber' | 'violet';
}) {
  return (
    <div className={`rounded-2xl px-3 py-2.5 text-center ${STAT_TONE[tone]}`}>
      <div className="text-[20px] font-semibold tabular-nums leading-none">{value}</div>
      <div className="mt-1 text-[11px] font-medium opacity-80">{label}</div>
    </div>
  );
}

function FindingGroup({
  title,
  findings,
  icon,
}: {
  title: string;
  findings: FindingChange[];
  icon: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-700">
        {icon}
        {title}
      </div>
      <ul className="mt-2 space-y-2">
        {findings.map((f) => (
          <li key={f.key} className="flex items-start gap-2.5 text-[13px]">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
            <div className="min-w-0">
              <p className="font-medium text-gray-800">{f.title}</p>
              {f.scope?.label && (
                <p className="truncate text-[12px] text-gray-400">{f.scope.label}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8">
      {children}
    </section>
  );
}
