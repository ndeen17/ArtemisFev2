import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { CalibrationResult } from '@artemis/shared';
import { CalibrationBadge } from './CalibrationBadge';

describe('CalibrationBadge', () => {
  it('renders nothing when calibration is null', () => {
    const { container } = render(<CalibrationBadge calibration={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing while the cohort is too thin (available:false)', () => {
    const calibration: CalibrationResult = {
      available: false,
      reason: 'insufficient_samples',
      sampleSize: 4,
    };
    const { container } = render(<CalibrationBadge calibration={calibration} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the band label, percentile, and sample size when available', () => {
    const calibration: CalibrationResult = {
      available: true,
      percentile: 91.4,
      zScore: 1.6,
      band: 'well_above',
      sampleSize: 42,
    };
    render(<CalibrationBadge calibration={calibration} />);
    expect(screen.getByTestId('calibration-badge')).toBeInTheDocument();
    expect(screen.getByText('Well above the field')).toBeInTheDocument();
    // Percentile is rounded for display.
    expect(screen.getByText(/Ahead of 91% of comparable CVs/)).toBeInTheDocument();
    expect(screen.getByText(/42 benchmarked/)).toBeInTheDocument();
  });

  it('maps each band to its own label', () => {
    const base = { available: true as const, percentile: 50, zScore: 0, sampleSize: 30 };
    const bands = [
      ['well_below', 'Well below the field'],
      ['below', 'Below the field'],
      ['around', 'Around the field'],
      ['above', 'Above the field'],
      ['well_above', 'Well above the field'],
    ] as const;
    for (const [band, label] of bands) {
      const { unmount } = render(
        <CalibrationBadge calibration={{ ...base, band }} />,
      );
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });
});
