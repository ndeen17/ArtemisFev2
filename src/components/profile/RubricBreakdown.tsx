import { Link } from 'react-router-dom';
import type { RubricItem } from '@artemis/shared';
import { CheckIcon } from '@/components/ui/icons';

/**
 * Phase C UI — shows the deterministic rubric the user can drive to 100.
 * Each item displays achieved/weight points and, when fixable in the editor,
 * a "Fix in builder" deep link to the matching section.
 */
export function RubricBreakdown({
  items,
  rubricScore,
  llmScore,
}: {
  items: RubricItem[];
  rubricScore: number | null;
  llmScore: number | null;
}) {
  if (!items.length) {
    return null;
  }
  return (
    <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
            Score breakdown
          </div>
          <h2 className="mt-1 text-[20px] font-semibold text-[#111827]">
            How your score is calculated
          </h2>
          <p className="mt-1 text-[13px] text-gray-500 max-w-xl">
            Your displayed score is the average of a deterministic rubric and the AI&apos;s
            holistic grade. Tick every item below and write a strong CV to reach 100.
          </p>
        </div>
        <div className="text-right">
          {rubricScore !== null ? (
            <div className="text-[12px] text-gray-500">
              Rubric <span className="font-semibold text-[#111827]">{rubricScore}</span>/100
            </div>
          ) : null}
          {llmScore !== null ? (
            <div className="text-[12px] text-gray-500">
              AI grade <span className="font-semibold text-[#111827]">{llmScore}</span>/100
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
                        <Link
                          to={`/profile/cv/edit#${item.section}`}
                          className="text-[12px] font-semibold text-[#15803d] hover:underline whitespace-nowrap"
                        >
                          Fix in builder →
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
