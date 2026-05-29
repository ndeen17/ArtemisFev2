import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GOAL_COPY, type Goal } from '@artemis/shared';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { Button } from '@/components/ui/Button';
import { ArrowRightIcon, SpinnerIcon, CheckIcon } from '@/components/ui/icons';
import { useGoal, useSetGoal } from '@/hooks/useGoal';
import { extractApiError } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';

const GOAL_VALUES: Goal[] = ['job_searching', 'levelling_up', 'exploring'];

/**
 * GOAL-02 — change your goal at any time. Mirrors the onboarding goal step
 * but persists via PATCH /goal (which audit-logs the change). Saving here
 * invalidates the dashboard query so personalisation updates on the next visit.
 */
export default function SettingsGoalPage() {
  const navigate = useNavigate();
  const goalQuery = useGoal();
  const setGoal = useSetGoal();
  const [selected, setSelected] = useState<Goal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (goalQuery.data?.goal && selected === null) {
      setSelected(goalQuery.data.goal);
    }
  }, [goalQuery.data, selected]);

  const currentGoal = goalQuery.data?.goal ?? null;
  const dirty = selected !== null && selected !== currentGoal;

  async function save() {
    if (!selected || !dirty) return;
    setError(null);
    setJustSaved(false);
    try {
      await setGoal.mutateAsync(selected);
      setJustSaved(true);
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  return (
    <SettingsLayout subtitle="Change what Artemis prioritises for you.">
      <div>
        <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
          Settings
        </div>
        <h1 className="mt-1 text-[28px] font-extrabold tracking-tight text-[#111827]">Your goal</h1>
        <p className="mt-2 text-[15px] text-gray-600 max-w-xl">
          Pick the goal that matches you right now. Your dashboard copy, top action, and
          recommendations all adapt to this choice.
        </p>
        {goalQuery.data?.goalSetAt ? (
          <p className="mt-1 text-[13px] text-gray-500">
            Last changed {new Date(goalQuery.data.goalSetAt).toLocaleString()}.
          </p>
        ) : null}
      </div>

      <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-[18px] font-bold text-[#111827]">What are you here for?</h2>
          <p className="mt-1 text-[13px] text-gray-500">
            One active goal at a time. Your dashboard top action and recommendations
            adapt to this choice.
          </p>
        </div>

        {/* Radio-row pattern: a fieldset of compact bordered rows. Each row
            shows the goal label + blurb so the user can compare without
            hidden text. This is the conventional settings shape for "pick one
            with prose descriptions" (Linear/Notion/GitHub all use it). */}
        <fieldset className="space-y-2.5">
          <legend className="sr-only">Your goal</legend>
          {GOAL_VALUES.map((value) => {
            const copy = GOAL_COPY[value];
            const isSelected = selected === value;
            const id = `settings-goal-${value}`;
            return (
              <label
                key={value}
                htmlFor={id}
                className={cn(
                  'flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition-colors',
                  isSelected
                    ? 'border-brand-green bg-[#f0fdf4] ring-1 ring-brand-green/30'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
                )}
              >
                <input
                  id={id}
                  type="radio"
                  name="settings-goal"
                  value={value}
                  checked={isSelected}
                  onChange={() => {
                    setJustSaved(false);
                    setSelected(value);
                  }}
                  disabled={setGoal.isPending}
                  className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/40"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-semibold text-[#111827]">
                    {copy.label}
                  </div>
                  <p className="mt-0.5 text-[13px] leading-snug text-gray-600">
                    {copy.blurb}
                  </p>
                </div>
              </label>
            );
          })}
        </fieldset>

        {error ? <div className="text-[13px] text-red-600">{error}</div> : null}
        {justSaved && !dirty ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-[#dcfce7] px-3 py-1 text-[12px] font-semibold text-[#15803d]">
            <CheckIcon width={14} height={14} stroke="#15803d" /> Saved
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-100">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#111827] hover:underline"
          >
            Back to home
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              disabled={setGoal.isPending}
            >
              Cancel
            </Button>
            <Button onClick={save} disabled={!dirty || setGoal.isPending}>
              {setGoal.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <SpinnerIcon /> Saving…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  Save goal <ArrowRightIcon />
                </span>
              )}
            </Button>
          </div>
        </div>
      </section>
    </SettingsLayout>
  );
}
