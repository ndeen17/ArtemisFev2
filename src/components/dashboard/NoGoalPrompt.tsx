import { Link } from 'react-router-dom';
import { ArrowRightIcon, TargetIcon } from '@/components/ui/icons';

/**
 * GOAL — neutral nudge shown on the dashboard when the user hasn't picked a goal yet.
 * Renders inline above the action list. Once they set a goal, this disappears and
 * the goal-aware copy / action priority kick in.
 */
export function NoGoalPrompt() {
  return (
    <section
      className="rounded-3xl border border-brand-green/30 bg-[#f6fffa] p-6 sm:p-7 flex items-start gap-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
      aria-label="Set a goal"
    >
      <div className="hidden sm:flex shrink-0 w-11 h-11 rounded-2xl bg-[#dcfce7] text-[#15803d] items-center justify-center">
        <TargetIcon />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
          Personalise Artemis
        </div>
        <h2 className="mt-1 text-[18px] font-semibold text-[#111827]">Set a goal</h2>
        <p className="mt-1 text-[14px] text-gray-600">
          Tell Artemis what you&apos;re here for so the dashboard, CTA, and action plan adapt to
          you.
        </p>
      </div>
      <Link
        to="/settings/goal"
        className="self-center inline-flex items-center gap-1 rounded-full bg-brand-green text-white px-4 py-2 text-[13px] font-semibold hover:bg-[#15803d]"
      >
        Set goal <ArrowRightIcon />
      </Link>
    </section>
  );
}
