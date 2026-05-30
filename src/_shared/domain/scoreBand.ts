/**
 * `scoreBand` — deterministic presentation layer over the calibrated CV score.
 *
 * The numeric `overallScore` (0–100) is the source of truth: it carries the
 * resolution the north-star z-score calibration needs, and the "since last
 * time" diff reads the raw delta. This helper does NOT replace that number —
 * it only maps it to a human-readable band + label so the UI can say
 * "Solid — competitive but not standout" next to the figure.
 *
 * Pure function — no I/O, no clock. Safe to import from FE, BE, and shared.
 */
import { z } from 'zod';

/** Closed band vocabulary, ordered weakest → strongest. */
export const ScoreBandSchema = z.enum([
  'needs_work',
  'developing',
  'solid',
  'strong',
  'standout',
]);
export type ScoreBand = z.infer<typeof ScoreBandSchema>;

/**
 * A score's presentation projection. `band` is the stable enum (good for
 * styling/branching); `label` is the short headline; `blurb` is the one-line
 * "where you stand" context.
 */
export const ScoreLabelSchema = z.object({
  band: ScoreBandSchema,
  label: z.string().min(1).max(40),
  blurb: z.string().min(1).max(120),
});
export type ScoreLabel = z.infer<typeof ScoreLabelSchema>;

/**
 * Band cut-points. Each entry is the INCLUSIVE lower bound for that band.
 * Ordered high → low so the first match wins.
 */
const BANDS: ReadonlyArray<{ min: number; value: ScoreLabel }> = [
  {
    min: 90,
    value: {
      band: 'standout',
      label: 'Standout',
      blurb: 'Top-tier — this CV competes for the best roles.',
    },
  },
  {
    min: 75,
    value: {
      band: 'strong',
      label: 'Strong',
      blurb: 'Competitive — a few tweaks from standout.',
    },
  },
  {
    min: 60,
    value: {
      band: 'solid',
      label: 'Solid',
      blurb: 'Competitive but not standout — keep pushing.',
    },
  },
  {
    min: 40,
    value: {
      band: 'developing',
      label: 'Developing',
      blurb: 'On the right track — clear gaps to close.',
    },
  },
  {
    min: 0,
    value: {
      band: 'needs_work',
      label: 'Needs work',
      blurb: 'Early days — the action plan is your fastest win.',
    },
  },
];

/**
 * Map a 0–100 score to its presentation band. Scores are clamped to [0, 100]
 * so out-of-range inputs still resolve sanely. Returns a frozen-shape object
 * (new instance each call; callers may mutate freely).
 */
export function scoreLabel(score: number): ScoreLabel {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  for (const { min, value } of BANDS) {
    if (clamped >= min) return { ...value };
  }
  // Unreachable — the final band has min:0 — but keep TS exhaustive-happy.
  return { ...BANDS[BANDS.length - 1].value };
}
