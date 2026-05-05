import type { AtsScore } from '@artemis/shared';
import { atsBand } from '@artemis/shared';

/**
 * Phase 2 — ATS readiness card. Renders a deterministic ATS-pass estimate
 * computed server-side after Targeted CV / Cover Letter generation.
 *
 * The score is labelled "estimate" because real ATS engines vary; this is
 * a rules-based simulation, not a verdict.
 */
const BAND_STYLES = {
  green: {
    ring: 'ring-emerald-200',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    bar: 'bg-emerald-500',
    label: 'Strong ATS fit',
  },
  amber: {
    ring: 'ring-amber-200',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    bar: 'bg-amber-500',
    label: 'Needs sharpening',
  },
  red: {
    ring: 'ring-rose-200',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    bar: 'bg-rose-500',
    label: 'High risk of rejection',
  },
} as const;

const TITLE_LABEL = {
  exact: 'Exact match to JD',
  semantic: 'Semantically aligned',
  mismatch: 'Off-title',
} as const;

interface Props {
  score: AtsScore | null | undefined;
  /** Hide rows that don't apply (cover letter mode skips headers/dates). */
  variant?: 'cv' | 'cover-letter';
}

export function AtsScoreCard({ score, variant = 'cv' }: Props) {
  if (!score) return null;
  const band = atsBand(score.overall);
  const style = BAND_STYLES[band];
  return (
    <section
      className={`rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8`}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
            ATS readiness · estimate
          </div>
          <h2 className="mt-1 text-[20px] font-semibold text-[#111827]">
            Estimated ATS match · {score.overall}/100
          </h2>
          <p className="mt-1 text-[13px] text-gray-500 max-w-xl">
            Rules-based score against the JD&apos;s structured brief. Real ATS engines
            vary — treat this as guidance, not a verdict.
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full ring-1 px-3 py-1 text-[12px] font-semibold ${style.bg} ${style.text} ${style.ring}`}
        >
          {style.label}
        </span>
      </div>

      <div className="mt-5 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full ${style.bar} transition-all`}
          style={{ width: `${Math.max(0, Math.min(100, score.overall))}%` }}
        />
      </div>

      <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Row label="Keyword coverage" value={`${Math.round(score.keywordMatchRate * 100)}%`} />
        <Row
          label="Contextual placement"
          value={`${Math.round(score.contextualPlacement * 100)}%`}
          hint="How many matched keywords appear inside experience bullets, not just the skills list."
        />
        <Row label="Title alignment" value={TITLE_LABEL[score.titleAlignment]} />
        {variant === 'cv' ? (
          <>
            <Row
              label="Standard sections"
              value={`${Math.round(score.headerCompliance * 100)}%`}
              hint="Summary, Experience, Education, Skills."
            />
            <Row
              label="Date consistency"
              value={`${Math.round(score.dateConsistency * 100)}%`}
            />
          </>
        ) : null}
      </dl>

      {score.missingTopKeywords.length > 0 ? (
        <div className="mt-6">
          <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-gray-500 mb-2">
            Top missing JD keywords
          </div>
          <div className="flex flex-wrap gap-2">
            {score.missingTopKeywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-200 px-3 py-1 text-[12px]"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {score.keywordStuffing.length > 0 ? (
        <div className="mt-5">
          <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-gray-500 mb-2">
            Possible keyword stuffing
          </div>
          <div className="flex flex-wrap gap-2">
            {score.keywordStuffing.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center rounded-full bg-amber-50 text-amber-800 ring-1 ring-amber-200 px-3 py-1 text-[12px]"
                title="Appeared more than 4 times — ATS engines often penalise saturation."
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
        {label}
      </dt>
      <dd className="mt-1 text-[14px] font-semibold text-[#111827]">{value}</dd>
      {hint ? <p className="mt-1 text-[12px] text-gray-500">{hint}</p> : null}
    </div>
  );
}
