import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GOAL_COPY, type Goal } from '@artemis/shared';
import { AppShell } from '@/components/layout/AppShell';
import { SelectableCard } from '@/components/onboarding/SelectableCard';
import { Button } from '@/components/ui/Button';
import { ArrowRightIcon, SpinnerIcon, CheckIcon } from '@/components/ui/icons';
import { useGoal, useSetGoal } from '@/hooks/useGoal';
import { extractApiError } from '@/hooks/useAuth';

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
    <AppShell title="Goal" subtitle="Change what Artemis prioritises for you.">
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

      <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8 space-y-4">
        {GOAL_VALUES.map((value) => {
          const copy = GOAL_COPY[value];
          return (
            <SelectableCard
              key={value}
              selected={selected === value}
              onSelect={() => {
                setJustSaved(false);
                setSelected(value);
              }}
              title={copy.label}
              description={copy.blurb}
            />
          );
        })}

        {error ? <div className="text-[13px] text-red-600">{error}</div> : null}
        {justSaved && !dirty ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-[#dcfce7] px-3 py-1 text-[12px] font-semibold text-[#15803d]">
            <CheckIcon width={14} height={14} stroke="#15803d" /> Saved
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4 pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#111827] hover:underline"
          >
            Back to dashboard
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
    </AppShell>
  );
}
