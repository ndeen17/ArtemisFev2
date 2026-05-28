/**
 * Deterministic CV rubric. Every check is a pure function of the user's
 * StructuredCv + their latest analysis result + their completed action ids,
 * so the same inputs always yield the same score. No randomness, no LLM.
 *
 * Total weight is exactly 100. The displayed cvScore is the average of this
 * rubric score and the LLM `overallScore`, so a 100 is reachable by any
 * candidate who satisfies all the deterministic checks AND writes a CV the
 * model rates 100. The prompt is tuned so genuinely strong CVs hit 95–100.
 */

import type { StructuredCv } from '../schemas/cv.js';
import type {
  AnalysisResult,
  AnalysisGap,
  AnalysisSuggestion,
} from '../schemas/analysis.js';
import type { RubricItem } from '../schemas/profile.js';
import { bulletVerbStrength } from './cvFeatures/gradedActionVerbBank.js';

// Phase 1a: the flat `STRONG_VERBS` allow-list previously embedded here has
// moved to `cvFeatures/gradedActionVerbBank.ts` as `STRONG_VERBS_LEGACY`
// (kept for regression tests) plus the new graded tiers (TIER_1/2/3). Item
// #6 below now reads `bulletVerbStrength(b) >= 2`, which is a strict
// superset of the old boolean test — no score regression.

const QUANTIFIER_RE = /\d|%|\$|£|€/;

function pct(n: number, d: number): number {
  if (d <= 0) return 0;
  return Math.max(0, Math.min(1, n / d));
}

function actionIdFromTitle(
  source: 'cv' | 'linkedin',
  kind: 'gap' | 'suggestion',
  title: string,
  hashFn: (s: string) => string,
): string {
  return hashFn(`${source}:${kind}:${title.trim().toLowerCase()}`).slice(0, 16);
}

export interface RubricInput {
  structured: StructuredCv | null;
  rawText: string | null;
  latest: AnalysisResult | null;
  completedActionIds: string[];
  /** Inject sha1 so this module stays pure-shared (works in both Node + browser). */
  sha1: (s: string) => string;
}

export interface RubricEvaluation {
  score: number; // 0..100 integer
  items: RubricItem[];
}

/** Build the deterministic rubric. Total weight = 100. */
export function evaluateRubric(input: RubricInput): RubricEvaluation {
  const { structured, rawText, latest, completedActionIds, sha1 } = input;
  const items: RubricItem[] = [];

  // 1. header_complete (5)
  {
    const h = structured?.header;
    const filled = [h?.fullName, h?.email, h?.headline, h?.location].filter(
      (s) => s && s.trim().length,
    ).length;
    items.push({
      id: 'header_complete',
      label: 'Header is complete',
      weight: 5,
      achieved: round1(5 * pct(filled, 4)),
      hint: 'Add full name, email, headline and location.',
      section: 'header',
    });
  }

  // 2. summary_present (5)
  {
    const len = (structured?.summary ?? '').trim().length;
    const ok = len >= 80 && len <= 600;
    items.push({
      id: 'summary_present',
      label: 'Summary is 80–600 characters',
      weight: 5,
      achieved: ok ? 5 : len > 0 ? 2 : 0,
      hint: 'Two to four sentences capturing who you are and what you bring.',
      section: 'summary',
    });
  }

  // 3. has_experience (5)
  {
    const count = structured?.experience.length ?? 0;
    items.push({
      id: 'has_experience',
      label: 'At least one role',
      weight: 5,
      achieved: count >= 1 ? 5 : 0,
      hint: 'Add at least one work experience entry.',
      section: 'experience',
    });
  }

  // 4. experience_depth (10) — at least 2 entries with ≥3 bullets each
  {
    const exp = structured?.experience ?? [];
    const goodEntries = exp.filter((e) => e.achievements.filter((a) => a.trim().length > 0).length >= 3);
    const ach = pct(goodEntries.length, 2);
    // Point at the first role that doesn't yet have 3+ non-empty bullets — that's
    // the one the user needs to flesh out to lift this score.
    const firstShallow = exp.find(
      (e) => e.achievements.filter((a) => a.trim().length > 0).length < 3,
    );
    items.push({
      id: 'experience_depth',
      label: 'Two roles with ≥3 achievements each',
      weight: 10,
      achieved: round1(10 * ach),
      hint: 'Lead each role with 3+ achievement bullets.',
      section: 'experience',
      itemId: ach < 1 ? firstShallow?.id ?? null : null,
      bulletIndex: null,
    });
  }

  // 5. quantified_bullets (10) — rebalanced from 15 to make room for ATS items.
  {
    const bullets = (structured?.experience ?? []).flatMap((e) =>
      e.achievements.filter((a) => a.trim().length > 0),
    );
    const quantified = bullets.filter((b) => QUANTIFIER_RE.test(b)).length;
    const ratio = pct(quantified, Math.max(bullets.length, 1));
    // full credit at >= 60%
    const achieved = round1(10 * Math.min(1, ratio / 0.6));
    // Point at the first un-quantified bullet across all roles so the builder
    // can land the cursor directly on a line missing a number.
    const firstWeak = findFirstBulletWhere(
      structured?.experience,
      (b) => !QUANTIFIER_RE.test(b),
    );
    items.push({
      id: 'quantified_bullets',
      label: 'Bullets quantify impact',
      weight: 10,
      achieved: bullets.length === 0 ? 0 : achieved,
      hint: 'Add a number, percentage, or currency to each achievement.',
      section: 'experience',
      itemId: achieved < 10 ? firstWeak?.itemId ?? null : null,
      bulletIndex: achieved < 10 ? firstWeak?.bulletIndex ?? null : null,
    });
  }

  // 6. strong_action_verbs (5) — rebalanced from 10.
  {
    const bullets = (structured?.experience ?? []).flatMap((e) =>
      e.achievements.filter((a) => a.trim().length > 0),
    );
    const strong = bullets.filter((b) => bulletVerbStrength(b) >= 2).length;
    const ratio = pct(strong, Math.max(bullets.length, 1));
    // full credit at >= 70%
    const achieved = round1(5 * Math.min(1, ratio / 0.7));
    // Point at the first bullet whose opener falls short of strong-verb tier 2.
    const firstWeakVerb = findFirstBulletWhere(
      structured?.experience,
      (b) => bulletVerbStrength(b) < 2,
    );
    items.push({
      id: 'strong_action_verbs',
      label: 'Bullets start with strong verbs',
      weight: 5,
      achieved: bullets.length === 0 ? 0 : achieved,
      hint: 'Open each bullet with Led / Built / Shipped / Reduced / Increased…',
      section: 'experience',
      itemId: achieved < 5 ? firstWeakVerb?.itemId ?? null : null,
      bulletIndex: achieved < 5 ? firstWeakVerb?.bulletIndex ?? null : null,
    });
  }

  // 7. has_education (5)
  {
    const count = structured?.education.length ?? 0;
    items.push({
      id: 'has_education',
      label: 'Education entry present',
      weight: 5,
      achieved: count >= 1 ? 5 : 0,
      hint: 'Add at least one qualification.',
      section: 'education',
    });
  }

  // 8. skills_breadth (10) — at least 8 skills
  {
    const count = structured?.skills.length ?? 0;
    const achieved = round1(10 * pct(count, 8));
    items.push({
      id: 'skills_breadth',
      label: 'At least 8 relevant skills',
      weight: 10,
      achieved,
      hint: 'Add the strongest 8–15 skills employers in your target role search for.',
      section: 'skills',
    });
  }

  // 9. keyword_gaps_closed (10) — rebalanced from 15.
  {
    const gaps = latest?.keywordGaps ?? [];
    const text = (rawText ?? '').toLowerCase();
    const closed = gaps.filter((kw) => text.includes(kw.toLowerCase())).length;
    // If no gaps were flagged, give full credit (model thought CV covered everything).
    const ratio = gaps.length === 0 ? 1 : pct(closed, gaps.length);
    items.push({
      id: 'keyword_gaps_closed',
      label: 'Keyword gaps closed',
      weight: 10,
      achieved: round1(10 * ratio),
      hint:
        gaps.length === 0
          ? 'No keyword gaps flagged.'
          : 'Add the missing keywords your target role expects (in skills or in context).',
      section: 'skills',
    });
  }

  // 10. gaps_resolved (10) — % of high/medium gaps the user has marked complete
  {
    const gaps: AnalysisGap[] = (latest?.gaps ?? []).filter((g) => g.severity !== 'low');
    const completed = new Set(completedActionIds);
    const resolved = gaps.filter((g) =>
      completed.has(actionIdFromTitle('cv', 'gap', g.title, sha1)),
    ).length;
    const ratio = gaps.length === 0 ? 1 : pct(resolved, gaps.length);
    items.push({
      id: 'gaps_resolved',
      label: 'High/medium gaps addressed',
      weight: 10,
      achieved: round1(10 * ratio),
      hint:
        gaps.length === 0
          ? 'No high or medium gaps flagged.'
          : 'Tick gaps off your action plan once you’ve addressed them in the builder.',
      section: null,
    });
  }

  // 11. actions_completed (5) — rebalanced from 10.
  {
    const sugs: AnalysisSuggestion[] = latest?.suggestions ?? [];
    const completed = new Set(completedActionIds);
    const done = sugs.filter((s) =>
      completed.has(actionIdFromTitle('cv', 'suggestion', s.title, sha1)),
    ).length;
    const ratio = sugs.length === 0 ? 1 : pct(done, sugs.length);
    items.push({
      id: 'actions_completed',
      label: 'Suggested actions completed',
      weight: 5,
      achieved: round1(5 * ratio),
      hint:
        sugs.length === 0
          ? 'No outstanding suggestions.'
          : 'Work through your action plan — each tick lifts your score.',
      section: null,
    });
  }

  // 12. ats_section_headers (5) — ATS engines need standard section labels.
  //     Penalise non-standard equivalents like "Career History" or "Competencies".
  {
    const text = rawText ?? '';
    const present = countAtsStandardHeaders(text);
    const offending = countAtsNonStandardHeaders(text);
    // Need at least Experience + Education + Skills equivalents present.
    let achieved = 0;
    if (present >= 3) achieved = 5;
    else if (present === 2) achieved = 3;
    else if (present === 1) achieved = 1;
    if (offending > 0 && achieved > 1) achieved = Math.max(1, achieved - 2);
    items.push({
      id: 'ats_section_headers',
      label: 'Uses ATS-standard section headers',
      weight: 5,
      achieved: round1(achieved),
      hint:
        offending > 0
          ? 'Rename non-standard sections (e.g. "Career History" → "Experience", "Competencies" → "Skills").'
          : 'Use Experience, Education, and Skills as section headers — applicant tracking systems look for those exact labels.',
      section: null,
    });
  }

  // 13. ats_date_consistency (5) — all role dates parse to a consistent format.
  {
    const exp = structured?.experience ?? [];
    const tokens = exp.flatMap((e) => [e.startDate, e.endDate].filter((d) => d.trim().length > 0));
    if (tokens.length === 0) {
      items.push({
        id: 'ats_date_consistency',
        label: 'Dates use a consistent format',
        weight: 5,
        achieved: 0,
        hint: 'Add start/end dates for each role using a consistent format (e.g. MM/YYYY).',
        section: 'experience',
        itemId: exp[0]?.id ?? null,
        bulletIndex: null,
      });
    } else {
      const formats = new Set(tokens.map(classifyDateFormat));
      formats.delete('unknown');
      const dominant = countDominantFormat(tokens);
      const ratio = pct(dominant, tokens.length);
      // Full credit at one consistent format. Partial as it fragments.
      const achieved = formats.size <= 1 ? 5 : round1(5 * Math.max(0.4, ratio));
      // Identify the first role whose dates don't fit the dominant format so
      // the builder can land on the offending entry.
      const dominantFmt = dominantFormatKey(tokens);
      const firstOffender = formats.size > 1
        ? exp.find((e) => {
            const s = e.startDate.trim();
            const en = e.endDate.trim();
            const sf = s ? classifyDateFormat(s) : 'unknown';
            const ef = en ? classifyDateFormat(en) : 'unknown';
            return (
              (sf !== 'unknown' && sf !== 'present' && sf !== dominantFmt) ||
              (ef !== 'unknown' && ef !== 'present' && ef !== dominantFmt)
            );
          })
        : undefined;
      items.push({
        id: 'ats_date_consistency',
        label: 'Dates use a consistent format',
        weight: 5,
        achieved,
        hint:
          formats.size <= 1
            ? 'Date formatting is consistent across roles.'
            : 'Use one date format across every role (e.g. all MM/YYYY, or all "Jan 2020").',
        section: 'experience',
        itemId: firstOffender?.id ?? null,
        bulletIndex: null,
      });
    }
  }

  // 14. ats_no_layout_traps (5) — flag tab-tables, pipe columns, ASCII art.
  {
    const text = rawText ?? '';
    const traps = detectAtsLayoutTraps(text);
    const achieved = traps.length === 0 ? 5 : Math.max(0, round1(5 - traps.length * 1.5));
    items.push({
      id: 'ats_no_layout_traps',
      label: 'No ATS-breaking layout',
      weight: 5,
      achieved,
      hint:
        traps.length === 0
          ? 'No tables, pipe-columns, or icon-only sections detected.'
          : `Detected ${traps.join(', ')}. ATS engines often skip content laid out this way — switch to plain bullet lists.`,
      section: null,
    });
  }

  // 15. verb_repetition (5) — penalise repeating the same opener within a role.
  {
    const exp = structured?.experience ?? [];
    const offenders = collectRepeatedVerbs(exp);
    let achieved = 5;
    if (offenders.length === 1) achieved = 3;
    else if (offenders.length >= 2) achieved = round1(Math.max(0, 5 - offenders.length * 1.5));
    // Point at the first repeat — the role and the second occurrence of the
    // offending verb, so the builder lands on a bullet the user can rewrite.
    let pinItemId: string | null = null;
    let pinBulletIndex: number | null = null;
    if (offenders.length > 0) {
      const first = offenders[0];
      const role = exp[first.roleIndex];
      if (role) {
        pinItemId = role.id;
        // Find the second occurrence of the repeated verb — first occurrence
        // is canonical, the duplicates are the ones worth rewriting.
        let seen = 0;
        for (let i = 0; i < role.achievements.length; i++) {
          const opener = role.achievements[i]
            .trim()
            .split(/\s+/)[0]
            ?.toLowerCase()
            .replace(/[^a-z]/g, '');
          if (opener === first.verb) {
            seen += 1;
            if (seen === 2) {
              pinBulletIndex = i;
              break;
            }
          }
        }
      }
    }
    items.push({
      id: 'verb_repetition',
      label: 'No verb repeats more than twice in a role',
      weight: 5,
      achieved,
      hint:
        offenders.length === 0
          ? 'Bullet openers feel varied across each role.'
          : `Repeated openers detected: ${offenders
              .map((o) => `"${o.verb}" ×${o.count} in ${o.roleLabel}`)
              .join('; ')}. Mix in fresh verbs from the same category.`,
      section: 'experience',
      itemId: pinItemId,
      bulletIndex: pinBulletIndex,
    });
  }

  const total = items.reduce((sum, i) => sum + i.achieved, 0);
  const score = Math.round(Math.max(0, Math.min(100, total)));
  return { score, items };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ---------- ATS heuristics ----------

/** Standard ATS-recognised section header tokens. Match is case-insensitive. */
const ATS_STANDARD_HEADERS = [
  /^\s*(?:work\s+)?experience\b/i,
  /^\s*employment\s+history\b/i,
  /^\s*professional\s+experience\b/i,
  /^\s*education\b/i,
  /^\s*skills\b/i,
  /^\s*technical\s+skills\b/i,
  /^\s*summary\b/i,
  /^\s*professional\s+summary\b/i,
];

/** Headers ATS systems frequently fail to map to the canonical sections. */
const ATS_NONSTANDARD_HEADERS = [
  /^\s*career\s+history\b/i,
  /^\s*career\s+highlights\b/i,
  /^\s*career\s+story\b/i,
  /^\s*competencies\b/i,
  /^\s*key\s+competencies\b/i,
  /^\s*core\s+competencies\b/i,
  /^\s*proficiencies\b/i,
  /^\s*expertise\b/i,
  /^\s*credentials\b/i,
  /^\s*qualifications\b/i, // ambiguous — not the same as Education to many ATS
];

function countAtsStandardHeaders(text: string): number {
  if (!text) return 0;
  const lines = text.split(/\r?\n/);
  let hits = 0;
  const seenCategories = new Set<string>();
  for (const line of lines) {
    for (const re of ATS_STANDARD_HEADERS) {
      if (re.test(line)) {
        // Bucket by canonical category so duplicates don't inflate the count.
        const cat = canonicalHeaderCategory(line);
        if (cat && !seenCategories.has(cat)) {
          seenCategories.add(cat);
          hits += 1;
        }
        break;
      }
    }
  }
  return hits;
}

function canonicalHeaderCategory(line: string): string | null {
  if (/experience|employment/i.test(line)) return 'experience';
  if (/education/i.test(line)) return 'education';
  if (/skill/i.test(line)) return 'skills';
  if (/summary/i.test(line)) return 'summary';
  return null;
}

function countAtsNonStandardHeaders(text: string): number {
  if (!text) return 0;
  const lines = text.split(/\r?\n/);
  let hits = 0;
  for (const line of lines) {
    if (ATS_NONSTANDARD_HEADERS.some((re) => re.test(line))) hits += 1;
  }
  return hits;
}

/**
 * Classify a single date token into a coarse format bucket so we can detect
 * inconsistency across roles. Returns 'unknown' for tokens we can't parse —
 * those are excluded from consistency checks.
 */
type DateFormat = 'mmYYYY' | 'monthYYYY' | 'YYYY' | 'present' | 'unknown';
function classifyDateFormat(token: string): DateFormat {
  const t = token.trim().toLowerCase();
  if (!t) return 'unknown';
  if (/^(present|current|now|ongoing)$/i.test(t)) return 'present';
  if (/^\d{1,2}\s*[\/\-.]\s*\d{4}$/.test(t)) return 'mmYYYY';
  if (
    /^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z.]*\s+\d{4}$/i.test(t)
  )
    return 'monthYYYY';
  if (/^\d{4}$/.test(t)) return 'YYYY';
  return 'unknown';
}

function countDominantFormat(tokens: string[]): number {
  const counts: Record<string, number> = {};
  for (const t of tokens) {
    const f = classifyDateFormat(t);
    if (f === 'unknown' || f === 'present') continue;
    counts[f] = (counts[f] ?? 0) + 1;
  }
  let max = 0;
  for (const k of Object.keys(counts)) max = Math.max(max, counts[k]);
  return max;
}

/** Return the most-common concrete date format across the tokens, or null when
 *  none can be classified. Used to identify which roles deviate. */
function dominantFormatKey(tokens: string[]): DateFormat | null {
  const counts: Record<string, number> = {};
  for (const t of tokens) {
    const f = classifyDateFormat(t);
    if (f === 'unknown' || f === 'present') continue;
    counts[f] = (counts[f] ?? 0) + 1;
  }
  let best: DateFormat | null = null;
  let bestCount = 0;
  for (const k of Object.keys(counts)) {
    if (counts[k] > bestCount) {
      best = k as DateFormat;
      bestCount = counts[k];
    }
  }
  return best;
}

/** Walk the experience array in order and return the first bullet (with its
 *  containing role id) that matches the predicate. Skips empty/whitespace-only
 *  bullets. Returns null when nothing matches. Used by rubric items that want
 *  to deep-link to the exact offending bullet. */
function findFirstBulletWhere(
  experience: ReadonlyArray<{ id: string; achievements: string[] }> | undefined,
  predicate: (bullet: string) => boolean,
): { itemId: string; bulletIndex: number } | null {
  if (!experience?.length) return null;
  for (const role of experience) {
    for (let i = 0; i < role.achievements.length; i++) {
      const a = role.achievements[i];
      if (!a || !a.trim()) continue;
      if (predicate(a)) return { itemId: role.id, bulletIndex: i };
    }
  }
  return null;
}

/**
 * Detect text patterns that suggest layout choices known to break ATS parsing.
 * Returns a list of human-readable descriptors of what was found.
 */
function detectAtsLayoutTraps(text: string): string[] {
  const traps: string[] = [];
  if (!text) return traps;
  const lines = text.split(/\r?\n/);
  // Pipe-as-column: lines with 2+ pipes and short cell-like segments.
  let pipeLines = 0;
  for (const line of lines) {
    if ((line.match(/\|/g) ?? []).length >= 2) pipeLines += 1;
  }
  if (pipeLines >= 3) traps.push('pipe-delimited columns');

  // Tab-as-column: lines with 2+ tabs.
  let tabLines = 0;
  for (const line of lines) {
    if ((line.match(/\t/g) ?? []).length >= 2) tabLines += 1;
  }
  if (tabLines >= 3) traps.push('tab-aligned tables');

  // ASCII box art / decorations.
  if (/[┌┐└┘├┤┬┴┼─│]/.test(text)) traps.push('ASCII box art');

  // Heavy use of decorative symbols often used as bullet replacements.
  const decorative = (text.match(/[●◆◼■□▪►▶★☆✓✔✦]/g) ?? []).length;
  if (decorative >= 8) traps.push('icon-only bullet markers');

  return traps;
}

// ---------- Verb repetition ----------

export interface RepeatedVerb {
  verb: string;
  count: number;
  roleLabel: string;
  /** 0-based index of the role within the structured CV's experience array. */
  roleIndex: number;
}

/**
 * Find verbs that open more than two bullets within the same role.
 * Surfaced in the rubric hint and on the FE bullet-feedback chips.
 */
export function findRepeatedVerbs(
  experience: ReadonlyArray<{ title?: string; company?: string; achievements: string[] }>,
): RepeatedVerb[] {
  return collectRepeatedVerbs(experience);
}

function collectRepeatedVerbs(
  experience: ReadonlyArray<{ title?: string; company?: string; achievements: string[] }>,
): RepeatedVerb[] {
  const out: RepeatedVerb[] = [];
  experience.forEach((role, idx) => {
    const counts = new Map<string, number>();
    for (const bullet of role.achievements) {
      const verb = bullet
        .trim()
        .split(/\s+/)[0]
        ?.toLowerCase()
        .replace(/[^a-z]/g, '');
      if (!verb || verb.length < 3) continue;
      counts.set(verb, (counts.get(verb) ?? 0) + 1);
    }
    for (const [verb, count] of counts) {
      if (count > 2) {
        out.push({
          verb,
          count,
          roleLabel:
            [role.title, role.company].filter((s) => s && s.trim().length > 0).join(' @ ') ||
            `Role ${idx + 1}`,
          roleIndex: idx,
        });
      }
    }
  });
  return out;
}

// ---------- ATS sub-score (consumed by FE) ----------

/** Items that compose the user-facing "ATS readiness" sub-band. */
export const ATS_RUBRIC_ITEM_IDS: ReadonlyArray<string> = [
  'ats_section_headers',
  'ats_date_consistency',
  'ats_no_layout_traps',
  'verb_repetition',
];

/**
 * Aggregate the four ATS-flavoured rubric items into a 0–100 sub-score.
 * Returns null if none of the items are present in the breakdown (e.g. an
 * older analysis run before Phase 0 shipped).
 */
export function atsSubScore(items: ReadonlyArray<RubricItem>): number | null {
  const ats = items.filter((i) => ATS_RUBRIC_ITEM_IDS.includes(i.id));
  if (ats.length === 0) return null;
  const totalWeight = ats.reduce((sum, i) => sum + i.weight, 0);
  const totalAchieved = ats.reduce((sum, i) => sum + i.achieved, 0);
  if (totalWeight === 0) return null;
  return Math.round((totalAchieved / totalWeight) * 100);
}
