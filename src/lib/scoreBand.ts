/**
 * Maps a 0–100 score (or null) to the visual band Artemis uses across the
 * dashboard, profile header, action plan, rubric, and score reveal.
 *
 * Bands follow the same thresholds as `bandCopy()` in `ProfileScoreCard`:
 *   ≥ 85  → strong   (brand green)
 *   ≥ 65  → ready    (emerald)
 *   ≥ 35  → building (amber)
 *   <  35 → starting (rose)
 *   null  → neutral  (gray)
 *
 * Returns a set of Tailwind class strings so consumers can apply consistent
 * colour without inlining the threshold logic each time. Add new variants
 * here only — don't duplicate the cutoffs in components.
 */
export type ScoreBand = 'strong' | 'ready' | 'building' | 'starting' | 'neutral';

export interface ScoreBandClasses {
  /** Solid fill — for progress bars, circular meter stroke fills, dots. */
  fill: string;
  /** Text colour — for tagline values, percentage labels. */
  text: string;
  /** Subtle background for chips. Pairs with `text`. */
  soft: string;
  /** Ring / border accent — for chip outlines, AA-safe outlines. */
  ring: string;
}

export function scoreBand(score: number | null | undefined): ScoreBand {
  if (score === null || score === undefined) return 'neutral';
  if (score >= 85) return 'strong';
  if (score >= 65) return 'ready';
  if (score >= 35) return 'building';
  return 'starting';
}

const CLASSES: Record<ScoreBand, ScoreBandClasses> = {
  strong: {
    fill: 'bg-brand-green',
    text: 'text-brand-greenInk',
    soft: 'bg-brand-greenSoft',
    ring: 'ring-emerald-200',
  },
  ready: {
    fill: 'bg-emerald-500',
    text: 'text-emerald-700',
    soft: 'bg-emerald-50',
    ring: 'ring-emerald-200',
  },
  building: {
    fill: 'bg-amber-500',
    text: 'text-amber-700',
    soft: 'bg-amber-50',
    ring: 'ring-amber-200',
  },
  starting: {
    fill: 'bg-rose-500',
    text: 'text-rose-600',
    soft: 'bg-rose-50',
    ring: 'ring-rose-200',
  },
  neutral: {
    fill: 'bg-gray-300',
    text: 'text-gray-500',
    soft: 'bg-gray-100',
    ring: 'ring-gray-200',
  },
};

export function scoreBandClasses(score: number | null | undefined): ScoreBandClasses {
  return CLASSES[scoreBand(score)];
}
