import { useState } from 'react';
import type { Application } from '@artemis/shared';
import { useSetOutcome } from '@/hooks/useApplications';

/**
 * Phase 5 — Outcome feedback loop. Asks the user once whether their AI-tailored
 * application got an interview / offer. The answers feed `aiRulesApplied` analytics
 * so we can measure which prompt versions and rules actually move the needle.
 */
export function OutcomePrompt({ app }: { app: Application }) {
  const setOutcome = useSetOutcome(app.id);
  const [dismissed, setDismissed] = useState(false);

  const status = app.status;
  if (status !== 'interview' && status !== 'offer') return null;
  if (dismissed) return null;

  const outcome = app.outcome ?? null;
  // Don't ask if both relevant questions are answered.
  const askInterview = outcome?.gotInterview === undefined;
  const askOffer = status === 'offer' && outcome?.gotOffer === undefined;
  if (!askInterview && !askOffer) return null;

  const pending = setOutcome.isPending;

  return (
    <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-emerald-700">
            Help us learn
          </div>
          <h3 className="mt-1 text-[16px] font-semibold text-[#111827]">
            How did this application go?
          </h3>
          <p className="mt-1 text-[13px] text-gray-600">
            Your answer helps tune Artemis for everyone — it stays private to your account.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-[12px] font-medium text-gray-500 hover:text-gray-700"
        >
          Dismiss
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {askInterview && (
          <OutcomeRow
            label="Did you get an interview?"
            disabled={pending}
            onYes={() => setOutcome.mutate({ gotInterview: true })}
            onNo={() => setOutcome.mutate({ gotInterview: false })}
          />
        )}
        {askOffer && (
          <OutcomeRow
            label="Did you get an offer?"
            disabled={pending}
            onYes={() => setOutcome.mutate({ gotOffer: true })}
            onNo={() => setOutcome.mutate({ gotOffer: false })}
          />
        )}
      </div>
    </div>
  );
}

function OutcomeRow({
  label,
  disabled,
  onYes,
  onNo,
}: {
  label: string;
  disabled: boolean;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-emerald-100">
      <span className="text-[14px] font-medium text-[#111827]">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onYes}
          disabled={disabled}
          className="rounded-full bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Yes
        </button>
        <button
          type="button"
          onClick={onNo}
          disabled={disabled}
          className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
        >
          No
        </button>
      </div>
    </div>
  );
}
