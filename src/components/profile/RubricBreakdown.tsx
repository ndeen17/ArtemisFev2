import type { RubricItem } from '@artemis/shared';
import { atsSubScore } from '@artemis/shared';
import { CheckIcon } from '@/components/ui/icons';
import type {
  BuilderSection,
  OpenBuilderOptions,
} from '@/hooks/useBuilderUrlState';

/**
 * Phase C UI — shows the deterministic rubric the user can drive to 100.
 * Each item displays achieved/weight points and, when fixable in the editor,
 * a "Fix in builder" deep link to the matching section.
 *
 * Pass `chromeless` when embedding inside another card (e.g. the Score details
 * accordion) so the outer rounded-card wrapper is skipped and the content
 * blends with its container.
 */
export function RubricBreakdown({
  items,
  rubricScore,
  llmScore,
  onOpenBuilder,
  chromeless = false,
}: {
  items: RubricItem[];
  rubricScore: number | null;
  llmScore: number | null;
  onOpenBuilder: (opts: OpenBuilderOptions) => void;
  chromeless?: boolean;
}) {
  if (!items.length) {
    return null;
  }
  const atsScore = atsSubScore(items);
  const atsBand =
    atsScore === null
      ? null
      : atsScore >= 80
      ? { label: 'Strong', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' }
      : atsScore >= 60
      ? { label: 'Needs work', tone: 'bg-amber-50 text-amber-700 ring-amber-200' }
      : { label: 'At risk', tone: 'bg-rose-50 text-rose-700 ring-rose-200' };

  const Wrapper = chromeless ? PassthroughWrapper : CardWrapper;

  return (
    <Wrapper>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          {chromeless ? null : (
            <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
              Score breakdown
            </div>
          )}
          <h2
            className={
              chromeless
                ? 'text-[16px] font-semibold text-[#111827]'
                : 'mt-1 text-[20px] font-semibold text-[#111827]'
            }
          >
            {chromeless ? 'ATS checklist' : 'How your score is calculated'}
          </h2>
          <p className="mt-1 text-[13px] text-gray-500 max-w-xl">
            {chromeless
              ? 'Mechanical checks an applicant tracking system runs on your CV. Tick each to lift the ATS portion of your score.'
              : "Your displayed score is the average of a deterministic rubric and the AI's holistic grade. Tick every item below and write a strong CV to reach 100."}
          </p>
        </div>
        <div className="text-right">
          {!chromeless && rubricScore !== null ? (
            <div className="text-[12px] text-gray-500">
              Rubric <span className="font-semibold text-[#111827]">{rubricScore}</span>/100
            </div>
          ) : null}
          {!chromeless && llmScore !== null ? (
            <div className="text-[12px] text-gray-500">
              AI grade <span className="font-semibold text-[#111827]">{llmScore}</span>/100
            </div>
          ) : null}
          {atsScore !== null && atsBand ? (
            <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]">
              <span
                className={`inline-flex items-center rounded-full ring-1 px-2 py-0.5 ${atsBand.tone}`}
                title="ATS readiness combines section headers, date consistency, layout traps, and verb variety."
              >
                ATS readiness · {atsScore}/100 · {atsBand.label}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <ul className="mt-6 space-y-2">
        {items.map((item) => {
          const pct = item.weight === 0 ? 0 : (item.achieved / item.weight) * 100;
          const fullCredit = item.achieved >= item.weight - 0.05;
          return (
            <li
              key={item.id}
              className="rounded-2xl border border-gray-100 bg-white p-3 sm:p-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 shrink-0 w-6 h-6 rounded-full inline-flex items-center justify-center ${
                    fullCredit
                      ? 'bg-brand-green text-white'
                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                  }`}
                  aria-hidden
                >
                  {fullCredit ? <CheckIcon className="w-4 h-4" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-[14px] font-semibold text-[#111827]">{item.label}</h3>
                    <span
                      className={`text-[12px] font-semibold tabular-nums ${
                        fullCredit ? 'text-[#15803d]' : 'text-gray-600'
                      }`}
                    >
                      {round1(item.achieved)} / {item.weight} pts
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-brand-green transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                    />
                  </div>
                  {!fullCredit ? (
                    <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-[12.5px] text-gray-600">{item.hint}</p>
                      {item.section ? (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenBuilder({
                              section: item.section as BuilderSection,
                            })
                          }
                          className="text-[12px] font-semibold text-[#15803d] hover:underline whitespace-nowrap"
                        >
                          Fix in builder →
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Wrapper>
  );
}

function CardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8">
      {children}
    </section>
  );
}

function PassthroughWrapper({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
