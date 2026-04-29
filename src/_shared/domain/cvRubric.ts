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

const STRONG_VERBS = new Set(
  [
    'led',
    'built',
    'shipped',
    'designed',
    'launched',
    'reduced',
    'increased',
    'migrated',
    'architected',
    'scaled',
    'mentored',
    'owned',
    'drove',
    'delivered',
    'automated',
    'negotiated',
    'implemented',
    'optimised',
    'optimized',
    'created',
    'developed',
    'managed',
    'engineered',
    'spearheaded',
    'pioneered',
    'transformed',
    'improved',
    'streamlined',
    'rebuilt',
    'introduced',
    'rolled out',
    'launched',
    'grew',
    'cut',
    'saved',
    'won',
    'closed',
    'shipped',
    'oversaw',
    'directed',
    'coordinated',
    'orchestrated',
    'modernised',
    'modernized',
    'simplified',
    'authored',
    'researched',
    'analysed',
    'analyzed',
    'forecasted',
    'negotiated',
    'recruited',
    'trained',
    'coached',
    'taught',
    'presented',
    'facilitated',
    'led',
  ].map((s) => s.toLowerCase()),
);

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
    items.push({
      id: 'experience_depth',
      label: 'Two roles with ≥3 achievements each',
      weight: 10,
      achieved: round1(10 * ach),
      hint: 'Lead each role with 3+ achievement bullets.',
      section: 'experience',
    });
  }

  // 5. quantified_bullets (15)
  {
    const bullets = (structured?.experience ?? []).flatMap((e) =>
      e.achievements.filter((a) => a.trim().length > 0),
    );
    const quantified = bullets.filter((b) => QUANTIFIER_RE.test(b)).length;
    const ratio = pct(quantified, Math.max(bullets.length, 1));
    // full credit at >= 60%
    const achieved = round1(15 * Math.min(1, ratio / 0.6));
    items.push({
      id: 'quantified_bullets',
      label: 'Bullets quantify impact',
      weight: 15,
      achieved: bullets.length === 0 ? 0 : achieved,
      hint: 'Add a number, percentage, or currency to each achievement.',
      section: 'experience',
    });
  }

  // 6. strong_action_verbs (10)
  {
    const bullets = (structured?.experience ?? []).flatMap((e) =>
      e.achievements.filter((a) => a.trim().length > 0),
    );
    const strong = bullets.filter((b) => {
      const first = b.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '') ?? '';
      return STRONG_VERBS.has(first);
    }).length;
    const ratio = pct(strong, Math.max(bullets.length, 1));
    // full credit at >= 70%
    const achieved = round1(10 * Math.min(1, ratio / 0.7));
    items.push({
      id: 'strong_action_verbs',
      label: 'Bullets start with strong verbs',
      weight: 10,
      achieved: bullets.length === 0 ? 0 : achieved,
      hint: 'Open each bullet with Led / Built / Shipped / Reduced / Increased…',
      section: 'experience',
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

  // 9. keyword_gaps_closed (15) — % of keywordGaps now present in raw text
  {
    const gaps = latest?.keywordGaps ?? [];
    const text = (rawText ?? '').toLowerCase();
    const closed = gaps.filter((kw) => text.includes(kw.toLowerCase())).length;
    // If no gaps were flagged, give full credit (model thought CV covered everything).
    const ratio = gaps.length === 0 ? 1 : pct(closed, gaps.length);
    items.push({
      id: 'keyword_gaps_closed',
      label: 'Keyword gaps closed',
      weight: 15,
      achieved: round1(15 * ratio),
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

  // 11. actions_completed (10) — % of suggestions completed
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
      weight: 10,
      achieved: round1(10 * ratio),
      hint:
        sugs.length === 0
          ? 'No outstanding suggestions.'
          : 'Work through your action plan — each tick lifts your score.',
      section: null,
    });
  }

  const total = items.reduce((sum, i) => sum + i.achieved, 0);
  const score = Math.round(Math.max(0, Math.min(100, total)));
  return { score, items };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
