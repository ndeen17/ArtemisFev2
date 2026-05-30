import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ProfileOverview } from '@artemis/shared';
import { Button } from '@/components/ui/Button';
import {
  SparklesIcon,
  SpinnerIcon,
  ChevronDownIcon,
  ArrowRightIcon,
  TrendUpIcon,
  TrendDownIcon,
} from '@/components/ui/icons';
import { useRefreshAnalysis } from '@/hooks/useAnalysis';
import { scoreBandClasses } from '@/lib/scoreBand';

/**
 * Resume page header — replaces the legacy ProfileOverviewCard.
 *
 * UX goals:
 *  - Show **one** readiness number plus the weekly delta. No competing tiles.
 *  - Make "what does Artemis grade me on?" answerable in one click via an
 *    inline disclosure (no page navigation). The disclosure names the two
 *    score components in plain English (ATS checklist + AI grade) and links
 *    out to the Score details accordion further down the page.
 *  - Primary CTA is "Edit my CV", which opens the inline builder. Re-analyse
 *    is a quieter secondary action.
 */

const STORAGE_KEY = 'artemis.profile.scoreExplainer.seen';

interface Props {
  overview: ProfileOverview | undefined;
  isLoading: boolean;
  hasCv: boolean;
  onEditCv: () => void;
  /** Anchor id of the Score details accordion (e.g. 'details'). */
  detailsAnchor?: string;
}

export function ResumeReadinessHeader({
  overview,
  isLoading,
  hasCv,
  onEditCv,
  detailsAnchor = 'details',
}: Props) {
  const refresh = useRefreshAnalysis();
  const [explainerOpen, setExplainerOpen] = useState(false);

  // Auto-expand the explainer the first time a user lands on this page after
  // their analysis has produced a score — they get to see the model once,
  // then it stays collapsed on every subsequent visit.
  useEffect(() => {
    if (!overview || overview.analysisStatus !== 'done') return;
    if (typeof window === 'undefined') return;
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        setExplainerOpen(true);
        window.localStorage.setItem(STORAGE_KEY, '1');
      }
    } catch {
      // Storage unavailable (private mode etc) — fall back to collapsed.
    }
  }, [overview]);

  if (isLoading || !overview) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-[14px] text-gray-500">
          <SpinnerIcon className="animate-spin" /> Loading resume…
        </div>
      </Card>
    );
  }

  const analysing =
    overview.analysisStatus === 'queued' || overview.analysisStatus === 'running';

  return (
    <Card>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
            Resume readiness
          </div>
          <div className="mt-1 flex items-baseline gap-3 flex-wrap">
            <span className="text-[56px] sm:text-[64px] font-extrabold tracking-tight text-ink leading-none tabular-nums">
              {overview.readinessScore !== null ? overview.readinessScore : '—'}
            </span>
            <span className="text-[20px] font-semibold text-gray-400">/ 100</span>
            <DeltaChip delta={overview.weeklyDelta} />
            <StatusChip status={overview.analysisStatus} hasCv={hasCv} />
          </div>
          {overview.scoreBand ? (
            <p className="mt-2 text-[14px] text-gray-700">
              <span className="font-semibold text-ink">{overview.scoreBand.label}</span>
              <span className="text-gray-400"> — {overview.scoreBand.blurb}</span>
            </p>
          ) : null}
          <p className="mt-2 text-[13px] text-gray-500 max-w-md">
            How ready your CV is for the roles you&apos;re targeting.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={onEditCv}
            disabled={!hasCv}
          >
            <SparklesIcon className="w-4 h-4 mr-1.5" />
            Edit my CV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending || !hasCv || analysing}
          >
            {refresh.isPending || analysing ? 'Re-analysing…' : 'Re-analyse'}
          </Button>
        </div>
      </div>

      {overview.levelResolution?.mismatch ? (
        <LevelMismatchBanner resolution={overview.levelResolution} />
      ) : null}

      {overview.analysisStatus === 'done' &&
      (overview.rubricScore !== null || overview.llmScore !== null) ? (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setExplainerOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-greenInk hover:underline"
            aria-expanded={explainerOpen}
          >
            What goes into this score?
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform ${
                explainerOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {explainerOpen ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ScoreComponent
                label="ATS checklist"
                score={overview.rubricScore}
                explainer="Mechanical checks an applicant tracking system runs — section headers, dates, verbs, formatting."
              />
              <ScoreComponent
                label="AI grade"
                score={overview.llmScore}
                explainer="How a recruiter-trained AI rates your writing, impact, and clarity."
              />
              <p className="sm:col-span-2 text-[12.5px] text-gray-500">
                Your score is the average of these two, so you can&apos;t game it by
                only chasing keywords.{' '}
                <a
                  href={`#${detailsAnchor}`}
                  className="font-semibold text-brand-greenInk hover:underline inline-flex items-center gap-0.5"
                >
                  See full breakdown <ArrowRightIcon className="w-3.5 h-3.5" />
                </a>
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

function ScoreComponent({
  label,
  score,
  explainer,
}: {
  label: string;
  score: number | null;
  explainer: string;
}) {
  const pct = score ?? 0;
  const band = scoreBandClasses(score);
  return (
    <div className="rounded-2xl border border-gray-100 bg-surface-muted p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-gray-500">
          {label}
        </span>
        <span className="text-[14px] font-bold tabular-nums text-ink">
          {score !== null ? `${score}/100` : '—'}
        </span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full transition-all ${band.fill}`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
      <p className="mt-2 text-[12px] text-gray-500 leading-snug">{explainer}</p>
    </div>
  );
}

function LevelMismatchBanner({
  resolution,
}: {
  resolution: NonNullable<ProfileOverview['levelResolution']>;
}) {
  return (
    <div
      role="status"
      className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 rounded-full bg-amber-100 p-1.5 text-amber-700">
          <SparklesIcon className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-amber-900">Calibrating to your CV</div>
          <p className="mt-0.5 leading-snug text-amber-900/90">{resolution.explanation}</p>
          <Link
            to="/settings/career"
            className="mt-1.5 inline-flex items-center gap-0.5 text-[12.5px] font-semibold text-amber-900 hover:underline"
          >
            Update your level <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function DeltaChip({ delta }: { delta: number | null }) {
  if (delta === null || delta === 0) return null;
  const positive = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        positive
          ? 'bg-brand-greenSoft text-brand-greenInk'
          : 'bg-rose-50 text-rose-600'
      }`}
      title="Change since your last analysis"
    >
      {positive ? (
        <TrendUpIcon className="w-3 h-3" />
      ) : (
        <TrendDownIcon className="w-3 h-3" />
      )}
      {positive ? '+' : ''}
      {delta}
    </span>
  );
}

function StatusChip({
  status,
  hasCv,
}: {
  status: ProfileOverview['analysisStatus'];
  hasCv: boolean;
}) {
  if (!hasCv) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
        No CV yet
      </span>
    );
  }
  if (status === 'queued' || status === 'running') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
        <SpinnerIcon className="w-3 h-3 animate-spin" /> Analysing
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-600">
        Analysis failed
      </span>
    );
  }
  return null;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white shadow-card p-6 sm:p-8">
      {children}
    </section>
  );
}
