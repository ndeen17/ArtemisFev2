import type { CalibrationResult, CalibrationBand } from '@artemis/shared';

/**
 * Presentation-only surface for the cohort calibration (#6c). Shows where the
 * CV's deterministic structural spine sits relative to comparable candidates
 * (same role + level), as a relative-standing chip plus a plain-English
 * percentile line.
 *
 * Deliberately renders nothing while the verdict is unavailable
 * (`null` / `available:false`) — the engine declines until a cohort reaches
 * MIN_CALIBRATION_SAMPLES, and we'd rather show no benchmark than a noisy one.
 */

const BAND_COPY: Record<CalibrationBand, { label: string; classes: string }> = {
  well_below: { label: 'Well below the field', classes: 'bg-rose-50 text-rose-600 ring-rose-200' },
  below: { label: 'Below the field', classes: 'bg-amber-50 text-amber-700 ring-amber-200' },
  around: { label: 'Around the field', classes: 'bg-gray-100 text-gray-600 ring-gray-200' },
  above: { label: 'Above the field', classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  well_above: {
    label: 'Well above the field',
    classes: 'bg-brand-greenSoft text-brand-greenInk ring-emerald-200',
  },
};

interface Props {
  calibration: CalibrationResult | null | undefined;
}

export function CalibrationBadge({ calibration }: Props) {
  if (!calibration || !calibration.available) return null;

  const copy = BAND_COPY[calibration.band];
  const ahead = Math.round(calibration.percentile);

  return (
    <div className="mt-3 flex items-center gap-2 flex-wrap" data-testid="calibration-badge">
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ring-1 ${copy.classes}`}
      >
        {copy.label}
      </span>
      <span className="text-[13px] text-gray-500">
        Ahead of {ahead}% of comparable CVs
        <span className="text-gray-400"> · {calibration.sampleSize} benchmarked</span>
      </span>
    </div>
  );
}
