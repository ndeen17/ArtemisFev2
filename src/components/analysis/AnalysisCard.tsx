import type { CvAnalysis, AnalysisGap, AnalysisScope, AnalysisSeverity } from '@artemis/shared';
import {
  SparklesIcon,
  AlertTriangleIcon,
  LightbulbIcon,
  SpinnerIcon,
  CheckIcon,
} from '@/components/ui/icons';
import { Button } from '@/components/ui/Button';
import { useRefreshAnalysis } from '@/hooks/useAnalysis';
import { ThumbsFeedback } from '@/components/feedback/ThumbsFeedback';
import { findingIdFromTitle } from '@/components/feedback/findingId';

const severityStyles: Record<AnalysisSeverity, { dot: string; label: string }> = {
  low: { dot: 'bg-emerald-400', label: 'Low' },
  medium: { dot: 'bg-amber-400', label: 'Medium' },
  high: { dot: 'bg-rose-500', label: 'High' },
};

interface Props {
  analysis: CvAnalysis | null | undefined;
  isLoading: boolean;
  hasCv: boolean;
}

export function AnalysisCard({ analysis, isLoading, hasCv }: Props) {
  const refresh = useRefreshAnalysis();

  if (!hasCv) return null;

  if (isLoading) {
    return (
      <Section>
        <div className="flex items-center gap-2 text-[14px] text-gray-500">
          <SpinnerIcon className="animate-spin" /> Loading analysis…
        </div>
      </Section>
    );
  }

  if (!analysis || analysis.status === 'queued' || analysis.status === 'running') {
    return (
      <Section>
        <Header
          eyebrow="CV insights"
          title="Analysing your CV…"
          subtitle="This usually takes 10–30 seconds. The page will update automatically."
        />
        <div className="mt-6 flex items-center gap-3 text-[14px] text-gray-600">
          <SpinnerIcon className="animate-spin text-brand-green" />
          <span>
            {analysis?.status === 'running' ? 'Working on it now…' : 'Queued for review…'}
          </span>
        </div>
      </Section>
    );
  }

  if (analysis.status === 'failed') {
    return (
      <Section>
        <Header
          eyebrow="CV insights"
          title="Analysis didn't complete"
          subtitle={analysis.error ?? 'Something went wrong.'}
        />
        <div className="mt-6">
          <Button
            variant="primary"
            size="sm"
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending}
          >
            {refresh.isPending ? 'Retrying…' : 'Try again'}
          </Button>
        </div>
      </Section>
    );
  }

  // status === 'done'
  const r = analysis.result!;
  return (
    <div className="space-y-6">
      <Section>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <Header
            eyebrow="CV insights"
            title={`Overall score · ${r.overallScore}/100`}
            subtitle={r.headline}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh.mutate()}
              disabled={refresh.isPending}
            >
              {refresh.isPending ? 'Re-analysing…' : 'Re-analyse'}
            </Button>
          </div>
        </div>

        <ScoreBar score={r.overallScore} />

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat label="Years experience" value={r.yearsExperience.toString()} />
          <Stat label="Detected roles" value={r.detectedRoles.length.toString()} />
          <Stat label="Skills extracted" value={r.extractedSkills.length.toString()} />
        </div>

        {r.detectedRoles.length > 0 && (
          <div className="mt-6">
            <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-gray-500 mb-2">
              Detected roles
            </div>
            <div className="flex flex-wrap gap-2">
              {r.detectedRoles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center rounded-full bg-[#dcfce7] text-[#15803d] px-3 py-1 text-[12px] font-medium"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}

        {r.extractedSkills.length > 0 && (
          <div className="mt-5">
            <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-gray-500 mb-2">
              Skills
            </div>
            <div className="flex flex-wrap gap-2">
              {r.extractedSkills.slice(0, 24).map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-3 py-1 text-[12px]"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ListSection
          title="Strengths"
          icon={<SparklesIcon className="text-brand-green" />}
          items={r.strengths.map((s, i) => (
            <Item
              key={i}
              title={s.title}
              detail={s.detail}
              accent="bg-[#dcfce7] text-[#15803d]"
              footer={
                <ThumbsFeedback
                  surface="analysis_strength"
                  surfaceId={analysis.id}
                  findingId={findingIdFromTitle(s.title)}
                />
              }
            >
              <CheckIcon className="text-[#15803d]" />
            </Item>
          ))}
        />
        <ListSection
          title="Gaps"
          icon={<AlertTriangleIcon className="text-amber-500" />}
          items={r.gaps.map((g, i) => (
            <GapItem key={i} gap={g} analysisId={analysis.id} />
          ))}
        />
      </div>

      <ListSection
        title="Suggestions"
        icon={<LightbulbIcon className="text-brand-green" />}
        items={r.suggestions.map((s, i) => (
          <Item
            key={i}
            title={s.title}
            detail={s.detail}
            accent="bg-[#dcfce7] text-[#15803d]"
            scope={s.scope}
            footer={
              <ThumbsFeedback
                surface="analysis_suggestion"
                surfaceId={analysis.id}
                findingId={findingIdFromTitle(s.title)}
              />
            }
          >
            <LightbulbIcon className="text-[#15803d]" />
          </Item>
        ))}
      />
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8">
      {children}
    </div>
  );
}

function Header({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
        {eyebrow}
      </div>
      <h2 className="text-[22px] font-extrabold tracking-tight text-[#111827] leading-[1.1]">
        {title}
      </h2>
      {subtitle && <p className="text-[14px] text-gray-600 max-w-2xl">{subtitle}</p>}
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-400' : 'bg-rose-500';
  return (
    <div className="mt-5">
      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full ${color}`}
          style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#fafafa] border border-gray-100 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
        {label}
      </div>
      <div className="text-[20px] font-extrabold text-[#111827] mt-0.5">{value}</div>
    </div>
  );
}

function ListSection({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: React.ReactNode[];
}) {
  return (
    <Section>
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-[16px] font-semibold text-[#111827]">{title}</h3>
      </div>
      <ul className="mt-4 space-y-3">{items}</ul>
    </Section>
  );
}

function Item({
  title,
  detail,
  accent,
  scope,
  children,
  footer,
}: {
  title: string;
  detail: string;
  accent: string;
  scope?: AnalysisScope | null;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-[#fafafa] px-4 py-3">
      <span
        className={`flex-shrink-0 inline-flex items-center justify-center rounded-full w-7 h-7 ${accent}`}
      >
        {children}
      </span>
      <div className="min-w-0 flex-1">
        <ScopeEyebrow scope={scope} />
        <div className="text-[14px] font-semibold text-[#111827]">{title}</div>
        <div className="text-[13px] text-gray-600 mt-0.5">{detail}</div>
        {footer ? <div className="mt-1.5">{footer}</div> : null}
      </div>
    </li>
  );
}

/** Small uppercase eyebrow naming where a finding comes from, e.g.
 *  "Software Engineer · NeedSolution" or "Professional summary". Renders
 *  nothing for CV-wide findings with no resolved scope. */
function ScopeEyebrow({ scope }: { scope?: AnalysisScope | null }) {
  if (!scope) return null;
  return (
    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-green mb-0.5 truncate">
      {scope.label}
    </div>
  );
}

function GapItem({ gap, analysisId }: { gap: AnalysisGap; analysisId: string }) {
  const sev = severityStyles[gap.severity];
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-[#fafafa] px-4 py-3">
      <span className="flex-shrink-0 inline-flex items-center justify-center rounded-full w-7 h-7 bg-amber-100 text-amber-600">
        <AlertTriangleIcon />
      </span>
      <div className="min-w-0 flex-1">
        <ScopeEyebrow scope={gap.scope} />
        <div className="flex items-center justify-between gap-2">
          <div className="text-[14px] font-semibold text-[#111827]">{gap.title}</div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-600">
            <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} /> {sev.label}
          </span>
        </div>
        <div className="text-[13px] text-gray-600 mt-0.5">{gap.detail}</div>
        <ThumbsFeedback
          className="mt-1.5"
          surface="analysis_gap"
          surfaceId={analysisId}
          findingId={findingIdFromTitle(gap.title)}
        />
      </div>
    </li>
  );
}
