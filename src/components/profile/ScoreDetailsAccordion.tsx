import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { RubricItem, AnalysisResult, ProfileOverview } from '@artemis/shared';
import { roleLabel } from '@artemis/shared';
import { RubricBreakdown } from './RubricBreakdown';
import { BulletFeedbackList } from './BulletFeedback';
import { KeywordGapList } from './KeywordGapList';
import {
  ChevronDownIcon,
  SparklesIcon,
  AlertTriangleIcon,
  LightbulbIcon,
  CheckIcon,
  SpinnerIcon,
} from '@/components/ui/icons';
import { useLatestAnalysis } from '@/hooks/useAnalysis';
import { useOnboardingState } from '@/hooks/useOnboarding';
import type { OpenBuilderOptions } from '@/hooks/useBuilderUrlState';
import { ThumbsFeedback } from '@/components/feedback/ThumbsFeedback';
import { findingIdFromTitle } from '@/components/feedback/findingId';
import type { FindingFeedbackSurface } from '@artemis/shared';

/**
 * Score details accordion — the single home for everything that explains the
 * resume readiness score. Replaces the standalone RubricBreakdown section, the
 * separate `/profile/cv` page, and the inline strengths/gaps surfaces.
 *
 * Collapsed by default. Auto-expands when the URL hash is `#details` (used by
 * the redirect from `/profile/cv` and by the "See full breakdown" link in the
 * header).
 *
 * Internal tabs (just visual switches, all data is loaded once):
 *   - ATS checklist        — deterministic rubric, with Fix-in-builder links
 *   - Strengths & gaps     — LLM's qualitative read of the CV
 *   - Bullet feedback      — per-bullet coaching from the analysis
 *   - Keyword gaps         — chips of role-relevant terms the CV doesn't mention
 */

type Tab = 'ats' | 'insights' | 'bullets' | 'keywords';

const TAB_LABELS: Record<Tab, string> = {
  ats: 'ATS checklist',
  insights: 'Strengths & gaps',
  bullets: 'Bullet feedback',
  keywords: 'Keyword gaps',
};

interface Props {
  rubricItems: RubricItem[];
  rubricScore: number | null;
  llmScore: number | null;
  analysisStatus: ProfileOverview['analysisStatus'];
  onOpenBuilder: (opts: OpenBuilderOptions) => void;
}

export function ScoreDetailsAccordion({
  rubricItems,
  rubricScore,
  llmScore,
  analysisStatus,
  onOpenBuilder,
}: Props) {
  const location = useLocation();
  const analysis = useLatestAnalysis();
  const onboarding = useOnboardingState();
  const result = analysis.data?.status === 'done' ? analysis.data.result : null;
  const userRoleLabel = roleLabel(onboarding.data?.role ?? null);

  // The accordion is opt-in (collapsed by default) so the page header & action
  // plan stay the visible priority. Hash + ?tab= deep-links open it directly.
  const hash = location.hash.replace('#', '');
  const initialOpen = hash === 'details';
  const initialTab = readTabFromSearch(location.search) ?? 'ats';

  const [open, setOpen] = useState(initialOpen);
  const [tab, setTab] = useState<Tab>(initialTab);

  // Keep state in sync if the user follows another deep link without leaving.
  useEffect(() => {
    if (hash === 'details') setOpen(true);
    const t = readTabFromSearch(location.search);
    if (t) setTab(t);
  }, [hash, location.search]);

  // react-router-dom v6 doesn't auto-scroll to hash; bring this section into
  // view when the user lands here via `/profile#details` (e.g. from the legacy
  // `/profile/cv` redirect or the "See full breakdown" link in the header).
  useEffect(() => {
    if (hash !== 'details') return;
    const el = document.getElementById('details');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  const hasAnything = rubricItems.length > 0 || result !== null;
  const analysing =
    analysisStatus === 'queued' || analysisStatus === 'running';

  // Hide entirely only when there's nothing to show *and* nothing in flight
  // (e.g. brand-new user without a CV). Otherwise we always render the section
  // so the page layout stays stable as analysis state transitions.
  if (!hasAnything && !analysing && analysisStatus !== 'failed') {
    return null;
  }

  // Skeleton state — mid-analysis with no rubric yet. Keeps the section
  // present so users don't see the page jump when results land.
  if (!hasAnything && analysing) {
    return (
      <section
        id="details"
        className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8"
      >
        <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
          Why this score
        </div>
        <h2 className="mt-1 text-[20px] font-semibold text-[#111827]">Score details</h2>
        <div className="mt-4 flex items-center gap-2 text-[14px] text-gray-500">
          <SpinnerIcon className="animate-spin" /> Analysing your CV — the breakdown
          appears here in 10–30 seconds.
        </div>
        <div className="mt-5 space-y-2">
          <div className="h-3 w-3/4 rounded bg-gray-100 animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-gray-100 animate-pulse" />
          <div className="h-3 w-2/3 rounded bg-gray-100 animate-pulse" />
        </div>
      </section>
    );
  }

  // Failed state — keep the section so users have a place to retry from. The
  // Re-analyse action lives in the header so we just message the failure.
  if (!hasAnything && analysisStatus === 'failed') {
    return (
      <section
        id="details"
        className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8"
      >
        <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
          Why this score
        </div>
        <h2 className="mt-1 text-[20px] font-semibold text-[#111827]">Score details</h2>
        <p className="mt-3 text-[14px] text-gray-500">
          The last analysis didn&apos;t complete. Use{' '}
          <span className="font-semibold text-[#111827]">Re-analyse</span> above to
          try again.
        </p>
      </section>
    );
  }

  return (
    <section
      id="details"
      className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 p-6 sm:p-8 text-left hover:bg-gray-50/40 transition-colors"
      >
        <div>
          <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
            Why this score
          </div>
          <h2 className="mt-1 text-[20px] font-semibold text-[#111827]">
            Score details
          </h2>
          <p className="mt-1 text-[13px] text-gray-500 max-w-xl">
            The full breakdown — the ATS checklist, what Artemis liked and didn&apos;t,
            bullet-by-bullet feedback, and the keywords your CV is missing.
          </p>
        </div>
        <ChevronDownIcon
          className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open ? (
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 border-t border-gray-100">
          <div className="mt-5 flex flex-wrap gap-1.5 border-b border-gray-100">
            {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-2 text-[13px] font-semibold rounded-t-lg border-b-2 -mb-px transition-colors ${
                  tab === t
                    ? 'border-brand-greenInk text-brand-greenInk'
                    : 'border-transparent text-gray-500 hover:text-ink'
                }`}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {tab === 'ats' ? (
              <ATSTab
                items={rubricItems}
                rubricScore={rubricScore}
                llmScore={llmScore}
                onOpenBuilder={onOpenBuilder}
              />
            ) : null}
            {tab === 'insights' ? (
              <InsightsTab
                loading={analysis.isLoading}
                result={result}
                analysisId={analysis.data?.id ?? null}
              />
            ) : null}
            {tab === 'bullets' ? (
              <BulletsTab loading={analysis.isLoading} result={result} />
            ) : null}
            {tab === 'keywords' ? (
              <KeywordsTab
                loading={analysis.isLoading}
                result={result}
                roleLabelText={userRoleLabel}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function readTabFromSearch(search: string): Tab | null {
  const params = new URLSearchParams(search);
  const t = params.get('tab');
  if (t === 'ats' || t === 'insights' || t === 'bullets' || t === 'keywords') {
    return t;
  }
  return null;
}

function ATSTab({
  items,
  rubricScore,
  llmScore,
  onOpenBuilder,
}: {
  items: RubricItem[];
  rubricScore: number | null;
  llmScore: number | null;
  onOpenBuilder: (opts: OpenBuilderOptions) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="text-[14px] text-gray-500">
        The ATS checklist appears once your CV has been analysed.
      </p>
    );
  }
  return (
    <RubricBreakdown
      items={items}
      rubricScore={rubricScore}
      llmScore={llmScore}
      onOpenBuilder={onOpenBuilder}
      chromeless
    />
  );
}

function InsightsTab({
  loading,
  result,
  analysisId,
}: {
  loading: boolean;
  result: AnalysisResult | null;
  analysisId: string | null;
}) {
  if (loading) return <LoadingNote />;
  if (!result) return <EmptyAnalysis />;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ListBlock
        title="Strengths"
        icon={<SparklesIcon className="text-brand-greenInk" />}
        empty="No standout strengths yet — work through your action plan to build them."
        items={result.strengths.map((s, i) => (
          <ListRow
            key={i}
            title={s.title}
            detail={s.detail}
            accent="bg-brand-greenSoft text-brand-greenInk"
            icon={<CheckIcon className="text-brand-greenInk" />}
            footer={renderFeedback(analysisId, 'analysis_strength', s.title)}
          />
        ))}
      />
      <ListBlock
        title="Gaps"
        icon={<AlertTriangleIcon className="text-amber-500" />}
        empty="No major gaps flagged."
        items={result.gaps.map((g, i) => (
          <ListRow
            key={i}
            title={g.title}
            detail={g.detail}
            accent="bg-amber-100 text-amber-600"
            icon={<AlertTriangleIcon className="text-amber-600" />}
            footer={renderFeedback(analysisId, 'analysis_gap', g.title)}
          />
        ))}
      />
      {result.suggestions.length > 0 ? (
        <div className="lg:col-span-2">
          <ListBlock
            title="Suggestions"
            icon={<LightbulbIcon className="text-brand-greenInk" />}
            empty=""
            items={result.suggestions.map((s, i) => (
              <ListRow
                key={i}
                title={s.title}
                detail={s.detail}
                accent="bg-brand-greenSoft text-brand-greenInk"
                icon={<LightbulbIcon className="text-brand-greenInk" />}
                footer={renderFeedback(analysisId, 'analysis_suggestion', s.title)}
              />
            ))}
          />
        </div>
      ) : null}
    </div>
  );
}

function renderFeedback(
  analysisId: string | null,
  surface: FindingFeedbackSurface,
  title: string,
): React.ReactNode {
  if (!analysisId) return null;
  return (
    <ThumbsFeedback
      surface={surface}
      surfaceId={analysisId}
      findingId={findingIdFromTitle(title)}
    />
  );
}

function BulletsTab({
  loading,
  result,
}: {
  loading: boolean;
  result: AnalysisResult | null;
}) {
  if (loading) return <LoadingNote />;
  if (!result) return <EmptyAnalysis />;
  const items = result.bulletFeedback ?? [];
  return (
    <div>
      <p className="text-[13px] text-gray-500 mb-4">
        Tap <span className="font-semibold text-[#111827]">Rewrite</span> on any
        bullet to open it in the rewriter.
      </p>
      <BulletFeedbackList items={items} />
    </div>
  );
}

function KeywordsTab({
  loading,
  result,
  roleLabelText,
}: {
  loading: boolean;
  result: AnalysisResult | null;
  roleLabelText: string | null;
}) {
  if (loading) return <LoadingNote />;
  if (!result) return <EmptyAnalysis />;
  return (
    <KeywordGapList
      keywords={result.keywordGaps ?? []}
      source="role"
      roleLabel={roleLabelText}
    />
  );
}

function LoadingNote() {
  return (
    <div className="flex items-center gap-2 text-[14px] text-gray-500">
      <SpinnerIcon className="animate-spin" /> Loading…
    </div>
  );
}

function EmptyAnalysis() {
  return (
    <p className="text-[14px] text-gray-500">
      Details appear here once Artemis finishes analysing your CV.
    </p>
  );
}

function ListBlock({
  title,
  icon,
  items,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  items: React.ReactNode[];
  empty: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-[15px] font-semibold text-[#111827]">{title}</h3>
      </div>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2">{items}</ul>
      ) : empty ? (
        <p className="mt-3 text-[13px] text-gray-500">{empty}</p>
      ) : null}
    </div>
  );
}

function ListRow({
  title,
  detail,
  accent,
  icon,
  footer,
}: {
  title: string;
  detail: string;
  accent: string;
  icon: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-[#fafafa] px-4 py-3">
      <span
        className={`flex-shrink-0 inline-flex items-center justify-center rounded-full w-7 h-7 ${accent}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold text-[#111827]">{title}</div>
        <div className="text-[13px] text-gray-600 mt-0.5">{detail}</div>
        {footer ? <div className="mt-1.5">{footer}</div> : null}
      </div>
    </li>
  );
}
