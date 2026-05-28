/**
 * Graded action-verb bank — Phase 1a foundation for `bulletFeatures`.
 *
 * Replaces the flat 48-verb allow-list in `cvRubric.ts` (today: `STRONG_VERBS`
 * → boolean) with a 3-tier ladder so downstream features and the prompt can
 * reason about *how* strong a verb is, not just whether it's on the list:
 *
 *   tier 3 — leadership / scope-claiming. Communicates ownership, headcount,
 *            org-level outcomes. Inappropriate for student / entry levels;
 *            the seniority guard in `analyseCvPrompt` already enforces this.
 *   tier 2 — execution / delivery. The bulk of healthy IC bullets. Implies
 *            agency and a finished outcome.
 *   tier 1 — supportive / contributory. Honest framing for junior work or
 *            collaboration; not "weak" — appropriate for early-career CVs.
 *   tier 0 — anything else (filler / passive openers / non-verb starters).
 *
 * The previous flat `STRONG_VERBS` set is a strict subset of tiers 2+3 here
 * (verified by `STRONG_VERBS_LEGACY` below), so the rubric refactor in this
 * phase is a pure widening: every previously-strong verb stays strong.
 */

/** Verbs that claim leadership, scope, or org-level outcomes. */
export const TIER_3_VERBS: ReadonlySet<string> = new Set([
  // leadership scope
  'led',
  'directed',
  'oversaw',
  'spearheaded',
  'orchestrated',
  'pioneered',
  'championed',
  // ownership claims
  'owned',
  'drove',
  'managed',
  'governed',
  // architectural / strategic
  'architected',
  'transformed',
  'modernised',
  'modernized',
  'rearchitected',
  // org / people building
  'hired',
  'grew',
  'mentored',
  'coached',
  'recruited',
  'promoted',
  // commercial outcomes
  'negotiated',
  'closed',
  'won',
  'secured',
]);

/** Execution / delivery verbs — the bread and butter of strong IC bullets. */
export const TIER_2_VERBS: ReadonlySet<string> = new Set([
  // build / ship
  'built',
  'shipped',
  'launched',
  'released',
  'delivered',
  'rolled',
  'deployed',
  'implemented',
  'created',
  'developed',
  'engineered',
  'designed',
  'rebuilt',
  'refactored',
  'redesigned',
  'relaunched',
  'restructured',
  // measurable wins
  'reduced',
  'increased',
  'improved',
  'optimised',
  'optimized',
  'cut',
  'saved',
  'accelerated',
  'streamlined',
  'simplified',
  'scaled',
  'automated',
  // research / analysis
  'analysed',
  'analyzed',
  'researched',
  'investigated',
  'evaluated',
  'benchmarked',
  'forecasted',
  // migrations / introductions
  'migrated',
  'introduced',
  'integrated',
  'consolidated',
  // teaching / comms
  'trained',
  'taught',
  'presented',
  'facilitated',
  'authored',
  'documented',
  // cross-functional execution — legacy STRONG_VERB; tier 2 because it
  // implies agency over multiple parties.
  'coordinated',
  // generic agency
  'reviewed',
  'tested',
  'fixed',
  'resolved',
  'debugged',
]);

/** Supportive / contributory verbs — honest framing for junior work and
 *  collaboration. NOT weak — appropriate at the right level. */
export const TIER_1_VERBS: ReadonlySet<string> = new Set([
  'contributed',
  'supported',
  'assisted',
  'helped',
  'collaborated',
  'partnered',
  'participated',
  'prototyped',
  'explored',
  'learned',
  'shadowed',
  'observed',
  'worked',
  'used',
  'wrote',
  'updated',
  'maintained',
  'monitored',
  'tracked',
  'gathered',
  'compiled',
]);

/** The legacy flat allow-list from `cvRubric.ts` BEFORE Phase 1a. Kept as a
 *  named export so the rubric refactor can assert (via unit test) that every
 *  previously-strong verb is still classified at strength ≥ 2 — no
 *  regression in the binary "is strong?" sense. */
export const STRONG_VERBS_LEGACY: ReadonlySet<string> = new Set([
  'led', 'built', 'shipped', 'designed', 'launched', 'reduced', 'increased',
  'migrated', 'architected', 'scaled', 'mentored', 'owned', 'drove',
  'delivered', 'automated', 'negotiated', 'implemented', 'optimised',
  'optimized', 'created', 'developed', 'managed', 'engineered',
  'spearheaded', 'pioneered', 'transformed', 'improved', 'streamlined',
  'rebuilt', 'introduced', 'rolled', 'grew', 'cut', 'saved', 'won',
  'closed', 'oversaw', 'directed', 'coordinated', 'orchestrated',
  'modernised', 'modernized', 'simplified', 'authored', 'researched',
  'analysed', 'analyzed', 'forecasted', 'recruited', 'trained', 'coached',
  'taught', 'presented', 'facilitated',
]);

/**
 * Strength of a single verb token, 0–3. Normalises case and strips trailing
 * punctuation before lookup; does NOT lemmatise (the tier sets contain the
 * past-tense forms that dominate CV bullets, which is the only form we care
 * about here — present-tense and -ing forms are rare in well-written CVs and
 * are intentionally NOT credited as tier 2+).
 */
export function actionVerbStrength(verb: string): 0 | 1 | 2 | 3 {
  const cleaned = verb.trim().toLowerCase().replace(/[^a-z]/g, '');
  if (!cleaned) return 0;
  if (TIER_3_VERBS.has(cleaned)) return 3;
  if (TIER_2_VERBS.has(cleaned)) return 2;
  if (TIER_1_VERBS.has(cleaned)) return 1;
  return 0;
}

/**
 * Strength of a whole bullet by inspecting its first token. Mirrors the
 * legacy `STRONG_VERBS.has(firstWord)` logic in `cvRubric.ts` but returns a
 * graded value instead of a boolean.
 */
export function bulletVerbStrength(bullet: string): 0 | 1 | 2 | 3 {
  const first = bullet.trim().split(/\s+/)[0] ?? '';
  return actionVerbStrength(first);
}
