/**
 * `careerLevel` — deterministic resolver that combines a user's *claimed*
 * experience level (chosen during onboarding) with hard signals from their
 * CV (total months in role + most-recent role title) to decide which level
 * Artemis grades, suggests, and interviews against.
 *
 * Why deterministic? Letting the LLM reconcile this silently produces drift
 * across analyses — a candidate could see their suggestions oscillate between
 * "Senior" and "Mid" framings across re-runs. The resolver settles the
 * question once, with rules the user can predict and an explanation we can
 * surface in the UI.
 *
 * Pure function — no I/O, no clock. Safe to import from FE, BE, and the
 * shared workspace.
 */

import { z } from 'zod';
import { ExperienceLevelSchema, type ExperienceLevel } from '../schemas/onboarding.js';

/** Canonical level order — index = ordinal seniority. */
export const LEVEL_ORDER = ['student', 'entry', 'mid', 'senior', 'lead'] as const;

const LEVEL_LABEL: Record<ExperienceLevel, string> = {
  student: 'Student',
  entry: 'Entry',
  mid: 'Mid',
  senior: 'Senior',
  lead: 'Lead',
};

function idxOf(l: ExperienceLevel): number {
  return LEVEL_ORDER.indexOf(l);
}

function levelFromIdx(i: number): ExperienceLevel {
  const clamped = Math.max(0, Math.min(LEVEL_ORDER.length - 1, i));
  return LEVEL_ORDER[clamped] as ExperienceLevel;
}

/**
 * Convert total months of work history into the level a recruiter would
 * expect at that tenure. Buckets are intentionally generous on the low
 * end — first 2 years is "entry", next 4 are "mid", then "senior" through
 * year 10, "lead" after — mirroring how most engineering ladders read.
 *
 * 0 months → student (no dated experience)
 * <24 months → entry
 * 24–71 months → mid
 * 72–119 months → senior
 * ≥120 months → lead
 */
export function yearsBucketFromMonths(months: number): ExperienceLevel {
  if (months <= 0) return 'student';
  if (months < 24) return 'entry';
  if (months < 72) return 'mid';
  if (months < 120) return 'senior';
  return 'lead';
}

const TITLE_PATTERNS: Array<{ pattern: RegExp; level: ExperienceLevel }> = [
  // Entry-tier modifiers come FIRST — "Associate Product Manager" or
  // "Junior Tech Lead" should resolve as entry-level even though "Manager"
  // or "Lead" would otherwise hint senior. The junior modifier wins.
  {
    pattern: /\b(intern|trainee|apprentice|junior|jr\.?|associate|graduate)\b/i,
    level: 'entry',
  },
  // Lead-tier titles are unambiguous — "Staff", "Principal", "Director",
  // "Head of …", "VP …", "Chief …" all signal multi-team/org-level scope.
  {
    pattern:
      /\b(staff|principal|distinguished|fellow|director|head of|vp |vice president|chief)\b/i,
    level: 'lead',
  },
  // Senior-tier — "Senior", "Sr.", "Tech Lead", "Manager", "Engineering Manager".
  {
    pattern: /\b(senior|sr\.?|tech lead|engineering manager|manager)\b/i,
    level: 'senior',
  },
];

/**
 * Derive a level hint from a single role title (typically the most recent /
 * current role). Returns null when no pattern matches. Cheap regex — the
 * heavier `titleCanonicalise` lookup will land in Phase 1b without changing
 * this function's contract.
 */
export function titleHintFromText(title: string | null | undefined): ExperienceLevel | null {
  if (!title) return null;
  const trimmed = title.trim();
  if (!trimmed) return null;
  for (const p of TITLE_PATTERNS) {
    if (p.pattern.test(trimmed)) return p.level;
  }
  return null;
}

export interface CareerLevelInput {
  /** What the user picked during onboarding (or via Settings → Career). */
  claimed: ExperienceLevel | null | undefined;
  /** Months across all dated roles on the user's CV. Null if no CV / no parseable dates. */
  cvTotalMonths: number | null | undefined;
  /** Pre-computed level hint from the most-recent role title (see `titleHintFromText`). */
  cvTitleHint?: ExperienceLevel | null;
}

export type CareerLevelSource =
  | 'claimed' // User's pick stands (either no CV evidence, or claim aligns with CV).
  | 'cv' // No claim — used CV signals only.
  | 'reconciled-down' // Claim was ≥2 buckets above CV evidence; calibrated down.
  | 'reconciled-up' // Claim was ≥2 buckets below CV evidence; calibrated up.
  | 'default'; // No claim AND no CV evidence — fell back to 'mid'.

export interface CareerLevelResolution {
  claimed: ExperienceLevel | null;
  cvDerived: ExperienceLevel | null;
  resolved: ExperienceLevel;
  source: CareerLevelSource;
  /** True when claimed and CV-derived disagree by ≥2 buckets. */
  mismatch: boolean;
  /** Absolute bucket distance between claim and CV-derived (0..4). */
  bucketDelta: number;
  /** Original tenure input echoed back for UI copy. */
  cvTotalMonths: number | null;
  cvTitleHint: ExperienceLevel | null;
  /** One-sentence explanation suitable for surfacing in the UI. */
  explanation: string;
}

function describeMonths(months: number | null): string {
  if (!months || months <= 0) return 'no dated experience';
  const years = months / 12;
  if (years < 1) return `${Math.round(months)} months of experience`;
  if (years < 2) return 'about a year of experience';
  return `about ${Math.round(years)} years of experience`;
}

/**
 * Decide which level we grade and coach against.
 *
 * Algorithm (see plan):
 *   1. No CV evidence → use claim (or 'mid' fallback). source='claimed'|'default'.
 *   2. Derive a level from CV: cvDerived = max(yearsBucket, titleHint).
 *      Title can promote (a "Senior" title with only 3 years of dated history
 *      reads senior to recruiters), tenure alone can't be faked downward.
 *   3. No claim → use cvDerived. source='cv'.
 *   4. |claim - cvDerived| ≤ 1 bucket → trust the claim. source='claimed'.
 *   5. claim ≥2 above cvDerived → calibrate down to cvDerived+1 (one bucket
 *      of grace so users near a bucket boundary aren't slammed).
 *      source='reconciled-down', mismatch=true.
 *   6. claim ≥2 below cvDerived → calibrate up to cvDerived.
 *      source='reconciled-up', mismatch=true.
 */
export function resolveCareerLevel(input: CareerLevelInput): CareerLevelResolution {
  const claimed = (input.claimed ?? null) as ExperienceLevel | null;
  const months =
    typeof input.cvTotalMonths === 'number' && Number.isFinite(input.cvTotalMonths)
      ? Math.max(0, Math.round(input.cvTotalMonths))
      : null;
  const titleHint = input.cvTitleHint ?? null;

  const yearsBucket = months !== null ? yearsBucketFromMonths(months) : null;
  let cvDerived: ExperienceLevel | null = null;
  if (yearsBucket && titleHint) {
    cvDerived = idxOf(titleHint) > idxOf(yearsBucket) ? titleHint : yearsBucket;
  } else {
    cvDerived = yearsBucket ?? titleHint;
  }

  // No CV evidence at all.
  if (!cvDerived) {
    if (claimed) {
      return {
        claimed,
        cvDerived: null,
        resolved: claimed,
        source: 'claimed',
        mismatch: false,
        bucketDelta: 0,
        cvTotalMonths: months,
        cvTitleHint: titleHint,
        explanation: `Calibrated to your selected level (${LEVEL_LABEL[claimed]}). We'll refine once your CV is added.`,
      };
    }
    return {
      claimed: null,
      cvDerived: null,
      resolved: 'mid',
      source: 'default',
      mismatch: false,
      bucketDelta: 0,
      cvTotalMonths: months,
      cvTitleHint: titleHint,
      explanation: `No level selected — defaulting to Mid until you choose one or add a CV.`,
    };
  }

  // CV evidence but no claim.
  if (!claimed) {
    return {
      claimed: null,
      cvDerived,
      resolved: cvDerived,
      source: 'cv',
      mismatch: false,
      bucketDelta: 0,
      cvTotalMonths: months,
      cvTitleHint: titleHint,
      explanation: `Your CV shows ${describeMonths(months)} — calibrated to ${LEVEL_LABEL[cvDerived]}.`,
    };
  }

  const claimedIdx = idxOf(claimed);
  const derivedIdx = idxOf(cvDerived);
  const delta = claimedIdx - derivedIdx; // positive = claim above CV
  const absDelta = Math.abs(delta);

  if (absDelta <= 1) {
    return {
      claimed,
      cvDerived,
      resolved: claimed,
      source: 'claimed',
      mismatch: false,
      bucketDelta: absDelta,
      cvTotalMonths: months,
      cvTitleHint: titleHint,
      explanation: `Your CV (${describeMonths(months)}) aligns with your selected level (${LEVEL_LABEL[claimed]}).`,
    };
  }

  if (delta >= 2) {
    const resolved = levelFromIdx(derivedIdx + 1);
    return {
      claimed,
      cvDerived,
      resolved,
      source: 'reconciled-down',
      mismatch: true,
      bucketDelta: absDelta,
      cvTotalMonths: months,
      cvTitleHint: titleHint,
      explanation: `Your CV shows ${describeMonths(months)} — we've calibrated suggestions to ${LEVEL_LABEL[resolved]} so they match what an interviewer would expect.`,
    };
  }

  // delta <= -2: claim well below CV — calibrate up.
  return {
    claimed,
    cvDerived,
    resolved: cvDerived,
    source: 'reconciled-up',
    mismatch: true,
    bucketDelta: absDelta,
    cvTotalMonths: months,
    cvTitleHint: titleHint,
    explanation: `Your CV reads ${LEVEL_LABEL[cvDerived]} (${describeMonths(months)}) — calibrating up from your selected ${LEVEL_LABEL[claimed]}.`,
  };
}

/**
 * Zod schema for `CareerLevelResolution`. Used by ProfileOverview so the FE
 * can validate the resolution payload and refuse stale shapes.
 */
export const CareerLevelSourceSchema = z.enum([
  'claimed',
  'cv',
  'reconciled-down',
  'reconciled-up',
  'default',
]);

export const CareerLevelResolutionSchema = z.object({
  claimed: ExperienceLevelSchema.nullable(),
  cvDerived: ExperienceLevelSchema.nullable(),
  resolved: ExperienceLevelSchema,
  source: CareerLevelSourceSchema,
  mismatch: z.boolean(),
  bucketDelta: z.number().int().min(0).max(4),
  cvTotalMonths: z.number().int().min(0).nullable(),
  cvTitleHint: ExperienceLevelSchema.nullable(),
  explanation: z.string().min(1).max(300),
});
