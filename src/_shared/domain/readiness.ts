import type { CvSummary } from '../schemas/cv.js';
import type { CvAnalysis, AnalysisGap } from '../schemas/analysis.js';
import type { OnboardingState } from '../schemas/onboarding.js';

/**
 * Inputs to derive a single "readiness" snapshot.
 * Each field is optional / nullable so the helper works during partial onboarding.
 */
export interface ReadinessInput {
  onboarding: Pick<OnboardingState, 'onboardingComplete' | 'hasCv'> | null;
  cv: Pick<CvSummary, 'id' | 'source' | 'charCount'> | null;
  analysis: Pick<CvAnalysis, 'status' | 'result'> | null;
}

export interface ReadinessFactor {
  /** Stable id, used for keys + tracking. */
  id: 'profile' | 'cv_uploaded' | 'cv_quality' | 'cv_analysed' | 'next_steps';
  label: string;
  /** 0..1 weight of this factor in the overall score. Sum of all weights = 1. */
  weight: number;
  /** 0..1 attainment for this factor. */
  value: number;
  /** Whether the factor is satisfied (UI ticks). */
  done: boolean;
  /** Short hint for the UI when the factor is not yet satisfied. */
  hint: string;
}

export interface ReadinessSnapshot {
  /** 0..100 weighted score. */
  score: number;
  /** Coarse band — drives copy + colour. */
  band: 'starter' | 'building' | 'ready' | 'strong';
  factors: ReadinessFactor[];
}

const FACTOR_DEFS: Array<Omit<ReadinessFactor, 'value' | 'done'>> = [
  {
    id: 'profile',
    label: 'Profile set up',
    weight: 0.15,
    hint: 'Tell us about your role, experience, and goal.',
  },
  {
    id: 'cv_uploaded',
    label: 'CV on file',
    weight: 0.2,
    hint: 'Upload an existing CV or build one with our wizard.',
  },
  {
    id: 'cv_quality',
    label: 'CV has enough detail',
    weight: 0.15,
    hint: 'Aim for at least ~1,500 characters of substantive content.',
  },
  {
    id: 'cv_analysed',
    label: 'CV reviewed by Artemis',
    weight: 0.3,
    hint: 'We will surface strengths, gaps, and suggestions automatically.',
  },
  {
    id: 'next_steps',
    label: 'Profile insights are strong',
    weight: 0.2,
    hint: 'Address the high-severity gaps to push your overall score up.',
  },
];

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function deriveReadiness(input: ReadinessInput): ReadinessSnapshot {
  const profileComplete = !!input.onboarding?.onboardingComplete;
  const hasCv = !!input.cv || !!input.onboarding?.hasCv;
  const charCount = input.cv?.charCount ?? 0;
  const cvQualityValue = clamp01(charCount / 1500);
  const analysisStatus = input.analysis?.status;
  const analysisDone = analysisStatus === 'done';
  const overall = analysisDone ? (input.analysis?.result?.overallScore ?? 0) : 0;
  const highGaps = analysisDone
    ? (input.analysis?.result?.gaps ?? []).filter((g: AnalysisGap) => g.severity === 'high').length
    : 0;

  // next_steps factor: scaled by AI overall score, penalised by high-severity gaps.
  const nextStepsValue = analysisDone ? clamp01(overall / 100 - highGaps * 0.1) : 0;

  const values: Record<ReadinessFactor['id'], { value: number; done: boolean }> = {
    profile: { value: profileComplete ? 1 : 0, done: profileComplete },
    cv_uploaded: { value: hasCv ? 1 : 0, done: hasCv },
    cv_quality: { value: cvQualityValue, done: cvQualityValue >= 0.66 },
    cv_analysed: { value: analysisDone ? 1 : 0, done: analysisDone },
    next_steps: { value: nextStepsValue, done: nextStepsValue >= 0.7 },
  };

  const factors: ReadinessFactor[] = FACTOR_DEFS.map((d) => ({
    ...d,
    value: values[d.id].value,
    done: values[d.id].done,
  }));

  const score = Math.round(factors.reduce((acc, f) => acc + f.value * f.weight, 0) * 100);
  const band: ReadinessSnapshot['band'] =
    score >= 85 ? 'strong' : score >= 65 ? 'ready' : score >= 35 ? 'building' : 'starter';

  return { score, band, factors };
}
