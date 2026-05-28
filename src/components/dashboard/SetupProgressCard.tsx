import { Link } from 'react-router-dom';
import type { ReadinessFactor, ReadinessSnapshot } from '@artemis/shared';
import { ArrowRightIcon, SparklesIcon } from '@/components/ui/icons';

/**
 * Setup checklist — dashboard guided-onboarding widget.
 *
 * UX intent (Linear / Stripe / Notion pattern):
 *  - Frames itself plainly as **"Finish setting up Artemis"** — not the
 *    engineery "Setup progress" — so users know on sight what it's for.
 *  - **Each remaining step is a clickable destination**, not a passive
 *    checklist row. Clicking "Add your CV" jumps to the upload flow.
 *  - **Count, not progress bar.** Big bars belong on scores; checklists use
 *    "X of Y complete" chips so the visual language doesn't compete with
 *    the readiness card right below.
 *  - **Disappears at completion.** Returns null when score is 100 OR when
 *    every factor is done (avoids the "Fully set up" trophy paradox where
 *    factor count equals total but score is < 100 due to soft thresholds).
 *
 * Position: rendered directly below the hero, ABOVE the readiness card,
 * so new users see the guided path first. Existing users with everything
 * done never see this at all.
 */
interface Props {
  snapshot: ReadinessSnapshot;
}

/**
 * Each remaining factor links to where the user can actually finish it.
 * Most live on `/profile` because that's where editing + re-analysis live
 * post-onboarding; `/onboarding/cv` only fires when the user hasn't even
 * completed initial onboarding (the gate redirects them if they have).
 */
const FACTOR_TARGETS: Record<ReadinessFactor['id'], { to: string; cta: string }> = {
  profile: { to: '/settings/profile', cta: 'Complete profile' },
  cv_uploaded: { to: '/onboarding/cv', cta: 'Add my CV' },
  cv_quality: { to: '/profile', cta: 'Expand my CV' },
  cv_analysed: { to: '/profile', cta: 'Run analysis' },
  next_steps: { to: '/profile#actions', cta: 'Open action plan' },
};

export function SetupProgressCard({ snapshot }: Props) {
  const remaining = snapshot.factors.filter((f) => !f.done);
  const total = snapshot.factors.length;
  const done = total - remaining.length;

  // Hide entirely when fully done — either by count OR by score. Both are
  // checked because soft thresholds (e.g. cv_quality satisfies "done" at 66%
  // attainment) can land us with 5/5 done but score still < 100.
  if (remaining.length === 0 || snapshot.score >= 100) return null;

  return (
    <section className="rounded-3xl border border-brand-greenSoft bg-brand-greenWash p-5 sm:p-6 shadow-card">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="hidden sm:flex shrink-0 w-11 h-11 rounded-2xl bg-brand-greenSoft text-brand-greenInk items-center justify-center">
          <SparklesIcon />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[18px] sm:text-[20px] font-semibold text-ink">
              Finish setting up Artemis
            </h2>
            <span className="inline-flex items-center rounded-full bg-white border border-brand-greenSoft px-2.5 py-0.5 text-[11.5px] font-semibold text-brand-greenInk">
              {done} of {total} complete
            </span>
          </div>
          <p className="mt-1 text-[13px] text-ink-muted max-w-xl">
            A couple more steps and Artemis can give you the full picture —
            your readiness score, your action plan, the lot.
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {remaining.map((f) => {
          const target = FACTOR_TARGETS[f.id];
          return (
            <li key={f.id}>
              <Link
                to={target.to}
                aria-label={`${f.label} — ${target.cta}`}
                className="group flex items-center gap-3 rounded-2xl border border-white bg-white px-4 py-3 transition-colors hover:border-brand-greenSoft"
              >
                {/* Empty circle — affordance reads as "tick this off" without
                    the false implication that there's a checkbox interaction.
                    The whole row is the click target. */}
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-brand-greenInk transition-colors"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-ink truncate">
                    {f.label}
                  </div>
                  <div className="text-[12.5px] text-ink-muted truncate">{f.hint}</div>
                </div>
                <span className="flex-shrink-0 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-greenInk">
                  {target.cta}
                  <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
