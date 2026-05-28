import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ProfileOverview } from '@artemis/shared';
import { Button } from '@/components/ui/Button';
import { SparklesIcon } from '@/components/ui/icons';
import { useMarkScoreRevealSeen } from '@/hooks/useProfile';
import { scoreBandClasses } from '@/lib/scoreBand';

/**
 * PRF-05 — One-time animated score reveal. Triggers when ProfileOverview reports
 * `firstReveal: true`. Acknowledging routes back to /profile and flips the server
 * flag so subsequent visits go straight to overview.
 *
 * Animates the score from 0 → score over 1.4s. We deliberately keep the surface
 * minimal: one number, one tagline, three "what's next" links.
 */
interface Props {
  overview: ProfileOverview;
}

export function ScoreReveal({ overview }: Props) {
  const score = overview.cvScore ?? 0;
  const [display, setDisplay] = useState(0);
  const ack = useMarkScoreRevealSeen();
  const navigate = useNavigate();

  useEffect(() => {
    const start = performance.now();
    const duration = 1400;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * score));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const onContinue = () => {
    // Fire-and-forget the ack — the mutation optimistically clears firstReveal
    // in the cache via onMutate, so we can navigate immediately. If the POST
    // fails the worst case is the user sees the reveal again next visit.
    ack.mutate();
    navigate('/profile', { replace: true });
  };

  const tagline =
    score >= 85
      ? 'Strong starting point. Polish the edges.'
      : score >= 65
        ? "You're close. A few sharp edits will move you up fast."
        : score >= 35
          ? 'Solid raw material. Time to tighten and quantify.'
          : 'A clear baseline to build from.';

  return (
    <div className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-10 sm:p-14 text-center">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green"
      >
        Your CV score
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.6, ease: 'easeOut' }}
        className="mt-2 text-[88px] sm:text-[112px] font-extrabold tracking-tight text-[#111827] leading-none"
      >
        {display}
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        className="text-[14px] text-gray-500"
      >
        out of 100
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.4 }}
        className="mt-6 text-[18px] sm:text-[20px] font-semibold text-[#111827] max-w-xl mx-auto"
      >
        {tagline}
      </motion.p>

      {overview.rubricScore !== null || overview.llmScore !== null ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.5 }}
          className="mt-8 mx-auto max-w-xl"
        >
          <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-gray-500">
            How we got there
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <RevealComponent
              label="ATS checklist"
              score={overview.rubricScore}
              explainer="Mechanical checks an applicant tracking system runs on your CV."
            />
            <RevealComponent
              label="AI grade"
              score={overview.llmScore}
              explainer="How a recruiter-trained AI rates your writing and impact."
            />
          </div>
          <p className="mt-3 text-[12px] text-gray-500">
            Your score is the average of the two — so you can&apos;t game it by
            only chasing keywords.
          </p>
        </motion.div>
      ) : null}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.9, duration: 0.4 }}
        className="mt-8 flex items-center justify-center"
      >
        <Button variant="primary" size="md" onClick={onContinue}>
          <span className="inline-flex items-center gap-2">
            <SparklesIcon className="w-4 h-4" />
            See what to do next
          </span>
        </Button>
      </motion.div>
    </div>
  );
}

function RevealComponent({
  label,
  score,
  explainer,
}: {
  label: string;
  score: number | null;
  explainer: string;
}) {
  const pct = score ?? 0;
  const band = scoreBandClasses(score);
  return (
    <div className="rounded-2xl border border-gray-100 bg-surface-muted p-4">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-gray-500">
          {label}
        </span>
        <span className="text-[14px] font-bold tabular-nums text-ink">
          {score !== null ? `${score}/100` : '—'}
        </span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full transition-all duration-700 ${band.fill}`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
      <p className="mt-2 text-[12px] text-gray-500 leading-snug">{explainer}</p>
    </div>
  );
}
