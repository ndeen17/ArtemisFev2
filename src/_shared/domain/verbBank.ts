/**
 * Curated bank of strong CV action verbs, grouped by category.
 *
 * Used by:
 *   - The deterministic `verb_repetition` rubric item to suggest fresh
 *     alternatives when the same verb shows up too often within a role.
 *   - The frontend bullet feedback UI to surface category-aware swaps.
 *
 * Kept deliberately compact and curated rather than ML-derived — the goal
 * is a small, high-signal set the user can trust, not exhaustive coverage.
 */

export type VerbCategory =
  | 'leadership'
  | 'technical'
  | 'creative'
  | 'analytical'
  | 'support'
  | 'growth';

export const VERB_BANK: Record<VerbCategory, string[]> = {
  leadership: [
    'led',
    'directed',
    'championed',
    'spearheaded',
    'oversaw',
    'mentored',
    'coordinated',
    'orchestrated',
    'aligned',
    'mobilised',
  ],
  technical: [
    'built',
    'engineered',
    'shipped',
    'architected',
    'deployed',
    'integrated',
    'migrated',
    'refactored',
    'automated',
    'optimised',
  ],
  creative: [
    'designed',
    'crafted',
    'prototyped',
    'reimagined',
    'composed',
    'authored',
    'storyboarded',
    'illustrated',
    'shaped',
    'curated',
  ],
  analytical: [
    'analysed',
    'modelled',
    'forecasted',
    'evaluated',
    'benchmarked',
    'audited',
    'investigated',
    'quantified',
    'researched',
    'diagnosed',
  ],
  support: [
    'supported',
    'enabled',
    'coached',
    'guided',
    'trained',
    'facilitated',
    'partnered',
    'advocated',
    'assisted',
    'liaised',
  ],
  growth: [
    'grew',
    'increased',
    'scaled',
    'expanded',
    'accelerated',
    'launched',
    'introduced',
    'rolled out',
    'drove',
    'won',
  ],
};

/** Reverse lookup: a verb (lowercase) to its primary category. First match wins. */
const VERB_TO_CATEGORY: Record<string, VerbCategory> = (() => {
  const out: Record<string, VerbCategory> = {};
  for (const cat of Object.keys(VERB_BANK) as VerbCategory[]) {
    for (const verb of VERB_BANK[cat]) {
      const v = verb.toLowerCase();
      if (!(v in out)) out[v] = cat;
    }
  }
  return out;
})();

export function categoryForVerb(verb: string): VerbCategory | null {
  return VERB_TO_CATEGORY[verb.toLowerCase()] ?? null;
}

/**
 * Suggest up to `n` fresh verbs in the same category as the seed, excluding
 * any already in `exclude`. Falls back to leadership if the seed isn't known.
 */
export function suggestVerbAlternatives(
  seed: string,
  exclude: ReadonlyArray<string> = [],
  n = 3,
): string[] {
  const cat = categoryForVerb(seed) ?? 'leadership';
  const blocked = new Set([seed.toLowerCase(), ...exclude.map((s) => s.toLowerCase())]);
  return VERB_BANK[cat].filter((v) => !blocked.has(v.toLowerCase())).slice(0, n);
}
