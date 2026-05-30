/**
 * `scoreCalibration` — Backlog #6c. Turns a single score into a cohort-relative
 * verdict: where it sits within the historical distribution of comparable
 * scores (same `surface × role × level × promptVersion`).
 *
 * This is the north-star "z-score calibration". It deliberately normalises the
 * **deterministic structural spine** (#6b), not the raw LLM `overallScore`,
 * because the spine is the stable backbone — z-scoring a noisy LLM number would
 * just relocate the noise (see plan.md #6).
 *
 * Honest-about-data design: a percentile is meaningless against a handful of
 * samples, so the engine REFUSES to calibrate below `MIN_CALIBRATION_SAMPLES`
 * and returns `{ available: false }` with a reason. The UI shows the raw band
 * until a cohort has accrued enough history. This keeps the feature correct the
 * day it ships and lets it light up per-cohort as samples accumulate.
 *
 * Pure functions — no I/O, no clock, no randomness. Self-contained percentile /
 * z math (a tiny subset of `src/utils/distribution.ts`) so this module is
 * importable from FE, BE, and shared without a Node-only dependency.
 */
import { z } from 'zod';

/**
 * Minimum cohort sample size before a percentile/z-score is trustworthy enough
 * to surface. Below this we decline rather than mislead. 30 is the conventional
 * small-sample threshold where the distribution starts to stabilise.
 */
export const MIN_CALIBRATION_SAMPLES = 30;

/** Relative standing buckets, ordered weakest → strongest. */
export const CalibrationBandSchema = z.enum([
  'well_below',
  'below',
  'around',
  'above',
  'well_above',
]);
export type CalibrationBand = z.infer<typeof CalibrationBandSchema>;

export const CalibrationResultSchema = z.discriminatedUnion('available', [
  z.object({
    available: z.literal(false),
    /** Why calibration was declined — drives the UI fallback copy. */
    reason: z.enum(['insufficient_samples', 'no_variance']),
    /** How many cohort samples existed (so the UI can say "12 of 30"). */
    sampleSize: z.number().int().min(0),
  }),
  z.object({
    available: z.literal(true),
    /** Percentile rank 0–100: share of the cohort at or below this value. */
    percentile: z.number().min(0).max(100),
    /** Standardised distance from the cohort mean, in standard deviations. */
    zScore: z.number(),
    /** Relative-standing band derived from the percentile. */
    band: CalibrationBandSchema,
    /** Cohort sample size the verdict is based on. */
    sampleSize: z.number().int().min(MIN_CALIBRATION_SAMPLES),
  }),
]);
export type CalibrationResult = z.infer<typeof CalibrationResultSchema>;

function mean(values: readonly number[]): number {
  let total = 0;
  for (const v of values) total += v;
  return total / values.length;
}

function populationStddev(values: readonly number[], mu: number): number {
  let sumSq = 0;
  for (const v of values) sumSq += (v - mu) ** 2;
  return Math.sqrt(sumSq / values.length);
}

/** Percentile rank of `value` within `sample`, 0–100, mid-rank tie convention. */
function percentileRank(sample: readonly number[], value: number): number {
  let below = 0;
  let equal = 0;
  for (const v of sample) {
    if (v < value) below += 1;
    else if (v === value) equal += 1;
  }
  return ((below + equal / 2) / sample.length) * 100;
}

/** Percentile → relative-standing band. Boundaries: <10 / <33 / ≤67 / <90 / ≥90. */
function bandFromPercentile(p: number): CalibrationBand {
  if (p < 10) return 'well_below';
  if (p < 33) return 'below';
  if (p <= 67) return 'around';
  if (p < 90) return 'above';
  return 'well_above';
}

/**
 * Calibrate `value` against its cohort `sample`. Returns an unavailable verdict
 * when the cohort is too small to trust, or when every sample is identical (no
 * variance ⇒ a z-score is undefined and a percentile is meaningless).
 */
export function calibrateScore(
  value: number,
  sample: readonly number[],
): CalibrationResult {
  const sampleSize = sample.length;
  if (sampleSize < MIN_CALIBRATION_SAMPLES) {
    return { available: false, reason: 'insufficient_samples', sampleSize };
  }
  const mu = mean(sample);
  const sd = populationStddev(sample, mu);
  if (sd === 0) {
    return { available: false, reason: 'no_variance', sampleSize };
  }
  const percentile = percentileRank(sample, value);
  const zScore = (value - mu) / sd;
  return {
    available: true,
    percentile: Math.round(percentile * 10) / 10,
    zScore: Math.round(zScore * 100) / 100,
    band: bandFromPercentile(percentile),
    sampleSize,
  };
}
