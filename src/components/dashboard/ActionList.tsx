import { Link } from 'react-router-dom';
import {
  type ReadinessSnapshot,
  type CvAnalysis,
  type Goal,
  sortByGoalPriority,
} from '@artemis/shared';
import { ArrowRightIcon, SparklesIcon, AlertTriangleIcon, FileIcon, MicIcon } from '@/components/ui/icons';

export interface ActionItem {
  id: string;
  title: string;
  detail: string;
  cta: string;
  to: string;
  /** Visual emphasis. */
  tone: 'primary' | 'neutral';
  icon: 'cv' | 'sparkle' | 'gap' | 'interview';
}

/** Phase 8F — Surface a weak interview debrief on the dashboard. */
export interface WeakInterviewSummary {
  interviewId: string;
  overallScore: number;
  /** First entry from `debrief.nextActions`, when present. */
  nextAction: { title: string; detail: string; link?: string } | null;
  /** Used as a fallback detail when `nextAction` is missing. */
  weakness: string | null;
}

interface Props {
  /** Pass the readiness snapshot + latest analysis so we can derive ALL items from real state. */
  readiness: ReadinessSnapshot;
  analysis: CvAnalysis | null;
  hasCv: boolean;
  /** Phase 6 — when set, items are re-ranked using the goal's actionPriority map. */
  goal?: Goal | null;
  /** Phase 8F — most recent completed interview with overallScore < 70. */
  weakInterview?: WeakInterviewSummary | null;
}

function deriveActions({
  readiness,
  analysis,
  hasCv,
  weakInterview,
}: Omit<Props, 'goal'>): ActionItem[] {
  const actions: ActionItem[] = [];

  if (!hasCv) {
    actions.push({
      id: 'add-cv',
      title: 'Add your CV',
      detail: 'Upload an existing CV or build one with the Artemis wizard in under a minute.',
      cta: 'Add CV',
      to: '/onboarding/cv',
      tone: 'primary',
      icon: 'cv',
    });
  }

  if (analysis?.status === 'queued' || analysis?.status === 'running') {
    actions.push({
      id: 'analysing',
      title: 'CV analysis in progress',
      detail: 'Hold tight — Artemis is reviewing your CV. The dashboard will update automatically.',
      cta: 'View progress',
      to: '/profile',
      tone: 'neutral',
      icon: 'sparkle',
    });
  }

  if (analysis?.status === 'failed') {
    actions.push({
      id: 'retry-analysis',
      title: 'Re-run your CV analysis',
      detail: analysis.error ?? 'The last analysis attempt did not complete.',
      cta: 'Open resume',
      to: '/profile',
      tone: 'primary',
      icon: 'sparkle',
    });
  }

  if (analysis?.status === 'done' && analysis.result) {
    const highGaps = analysis.result.gaps.filter((g) => g.severity === 'high');
    if (highGaps[0]) {
      actions.push({
        id: 'fix-gap',
        title: `Address: ${highGaps[0].title}`,
        detail: highGaps[0].detail,
        cta: 'Open resume',
        to: '/profile',
        tone: 'primary',
        icon: 'gap',
      });
    } else {
      const topSuggestion = analysis.result.suggestions[0];
      if (topSuggestion) {
        actions.push({
          id: 'top-suggestion',
          title: topSuggestion.title,
          detail: topSuggestion.detail,
          cta: 'Open resume',
          to: '/profile',
          tone: 'neutral',
          icon: 'sparkle',
        });
      }
    }
  }

  // Phase 8F — latest weak interview debrief surfaces as a flagged action.
  if (weakInterview) {
    const next = weakInterview.nextAction;
    const detail =
      next?.detail ??
      weakInterview.weakness ??
      `Recent interview scored ${weakInterview.overallScore}/100. Open the debrief for a full breakdown.`;
    actions.push({
      id: 'interview-weak',
      title: next?.title ?? `Improve your interview performance (${weakInterview.overallScore}/100)`,
      detail,
      cta: 'Open debrief',
      to: next?.link?.startsWith('/') ? next.link : `/interviews/${weakInterview.interviewId}`,
      tone: 'primary',
      icon: 'interview',
    });
  }

  // Fallback when nothing else applies — encourage finishing remaining factors.
  if (actions.length === 0) {
    const firstUnfinished = readiness.factors.find((f) => !f.done);
    if (firstUnfinished) {
      actions.push({
        id: `factor-${firstUnfinished.id}`,
        title: firstUnfinished.label,
        detail: firstUnfinished.hint,
        cta: 'Continue',
        to: '/profile',
        tone: 'neutral',
        icon: 'sparkle',
      });
    }
  }

  return actions;
}

const iconMap = {
  cv: FileIcon,
  sparkle: SparklesIcon,
  gap: AlertTriangleIcon,
  interview: MicIcon,
};

export function ActionList(props: Props) {
  const derived = deriveActions(props);
  const items = sortByGoalPriority(derived, props.goal ?? null);
  if (items.length === 0) {
    return (
      <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8">
        <h2 className="text-[18px] font-semibold text-[#111827]">You&apos;re all caught up</h2>
        <p className="mt-2 text-[14px] text-gray-600">
          We&apos;ll surface new actions as your profile, applications, and interviews come online.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-green">
            Next steps
          </div>
          <h2 className="text-[20px] font-extrabold tracking-tight text-[#111827] leading-[1.15] mt-1">
            What to do next
          </h2>
        </div>
      </div>

      <ul className="space-y-3">
        {items.map((item) => {
          const Icon = iconMap[item.icon];
          const isPrimary = item.tone === 'primary';
          return (
            <li key={item.id}>
              <Link
                to={item.to}
                className={
                  'flex items-center gap-4 rounded-2xl border px-4 py-4 transition-colors ' +
                  (isPrimary
                    ? 'border-[#dcfce7] bg-[#f0fdf4] hover:bg-[#dcfce7]'
                    : 'border-gray-100 bg-[#fafafa] hover:bg-gray-50')
                }
              >
                <span
                  className={
                    'flex-shrink-0 inline-flex items-center justify-center rounded-full w-10 h-10 ' +
                    (isPrimary ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-gray-100 text-gray-600')
                  }
                >
                  <Icon />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-[#111827] truncate">
                    {item.title}
                  </div>
                  <div className="text-[13px] text-gray-600 mt-0.5 line-clamp-2">{item.detail}</div>
                </div>
                <span className="flex-shrink-0 inline-flex items-center gap-1 text-[13px] font-semibold text-[#111827]">
                  {item.cta}
                  <ArrowRightIcon className="w-4 h-4" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
