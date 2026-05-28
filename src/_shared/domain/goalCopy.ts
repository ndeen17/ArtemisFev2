import type { Goal } from '../schemas/onboarding.js';

/**
 * Phase 6 — Goal-based personalisation copy + behaviour maps.
 *
 * Single source of truth so the dashboard, profile, and CTA copy stay in lockstep
 * with whatever goal the user picked in onboarding (or changed later in /settings/goal).
 *
 * `actionPriority` is consumed by the dashboard ActionList to re-rank items so the
 * top recommendation matches the user's stated objective:
 *  - `job_searching`  → push interview prep + JD targeting up
 *  - `levelling_up`   → push skill-gap and growth items up
 *  - `exploring`      → push low-pressure discovery items up
 */
export type GoalCopyTone = 'urgent' | 'growth' | 'calm';

export interface GoalCopy {
  /** Used by the goal picker card in onboarding + /settings/goal. */
  label: string;
  /** Short rationale shown under the label on the picker. */
  blurb: string;
  /** Eyebrow line shown on the dashboard hero (above the greeting). */
  dashboardEyebrow: string;
  /** Subtitle copy on the dashboard hero. */
  dashboardSubtitle: string;
  /** Default primary CTA on the dashboard when the user has nothing urgent in flight. */
  primaryCtaLabel: string;
  /** Where the primary CTA navigates to. */
  primaryCtaTo: string;
  /** Tone hint used by visual styling (badge colour). */
  tone: GoalCopyTone;
  /**
   * Ordering hint for ActionList items. Lower = earlier.
   * Anything not in the map falls back to its natural rank.
   * Keys correspond to ActionItem.id values produced by `deriveActions`.
   */
  actionPriority: Record<string, number>;
}

/** What we show when the user has not picked a goal yet. */
export const NEUTRAL_GOAL_COPY: GoalCopy = {
  label: 'Set a goal',
  blurb: 'Pick a goal so Artemis can tailor your dashboard and recommendations.',
  dashboardEyebrow: 'Welcome',
  dashboardSubtitle: 'Set a goal to personalise your dashboard.',
  primaryCtaLabel: 'Set my goal',
  primaryCtaTo: '/settings/goal',
  tone: 'calm',
  actionPriority: {},
};

export const GOAL_COPY: Record<Goal, GoalCopy> = {
  job_searching: {
    label: "I'm job searching",
    blurb: 'Active hunt — prioritise interview prep and CV targeting for live roles.',
    dashboardEyebrow: 'Job search mode',
    dashboardSubtitle:
      "Let's get you interview-ready. Tighten your CV, then hit the mock interviews.",
    primaryCtaLabel: 'Start a mock interview',
    primaryCtaTo: '/interviews',
    tone: 'urgent',
    actionPriority: {
      'interview-weak': 0,
      'fix-gap': 1,
      'top-suggestion': 2,
      'add-cv': 3,
      'retry-analysis': 4,
      analysing: 5,
    },
  },
  levelling_up: {
    label: "I'm levelling up",
    blurb: 'Currently employed, growing — focus on skill gaps and longer-term positioning.',
    dashboardEyebrow: 'Growth mode',
    dashboardSubtitle: 'Sharpen the skills that move you up. Start with the highest-impact gap.',
    primaryCtaLabel: 'Open my action plan',
    primaryCtaTo: '/profile#actions',
    tone: 'growth',
    actionPriority: {
      'fix-gap': 0,
      'top-suggestion': 1,
      'interview-weak': 2,
      'retry-analysis': 3,
      'add-cv': 4,
      analysing: 5,
    },
  },
  exploring: {
    label: "I'm exploring",
    blurb: 'No pressure — get a baseline and try a sample interview to see where you stand.',
    dashboardEyebrow: 'Exploring',
    dashboardSubtitle:
      'Take it at your own pace. Start with a quick analysis, see where you stand.',
    primaryCtaLabel: 'See my CV analysis',
    primaryCtaTo: '/profile?tab=insights#details',
    tone: 'calm',
    actionPriority: {
      'add-cv': 0,
      'top-suggestion': 1,
      'fix-gap': 2,
      'interview-weak': 3,
      analysing: 4,
      'retry-analysis': 5,
    },
  },
};

/** Resolve copy for any goal (or null). Pure — safe to call from FE and BE. */
export function copyForGoal(goal: Goal | null | undefined): GoalCopy {
  if (!goal) return NEUTRAL_GOAL_COPY;
  return GOAL_COPY[goal];
}

/**
 * Sort a list of action items by the goal's priority map. Items with the same priority
 * preserve their relative order (stable sort). Items without a priority entry sit at the end.
 */
export function sortByGoalPriority<T extends { id: string }>(items: T[], goal: Goal | null): T[] {
  const map = copyForGoal(goal).actionPriority;
  const fallback = Number.MAX_SAFE_INTEGER;
  return [...items]
    .map((item, idx) => ({ item, idx, rank: map[item.id] ?? fallback }))
    .sort((a, b) => (a.rank === b.rank ? a.idx - b.idx : a.rank - b.rank))
    .map(({ item }) => item);
}
