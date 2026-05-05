import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ProgressDots } from './StepHeader';

interface Props {
  step: number;
  total?: number;
  /**
   * Deprecated — the layout no longer renders its own Back link. Each
   * onboarding page now places `<OnboardingBackButton />` inline with its
   * Continue button so the two stay vertically aligned. Kept on the props
   * type as an unused passthrough until all callers are migrated, then
   * removed.
   */
  backTo?: string;
  /** Use a wider container — useful for the multi-pane CV editor step. */
  wide?: boolean;
  children: ReactNode;
}

/**
 * Frame around every onboarding page — soft cream background, centered card with
 * progress, and an optional back link. Mirrors the landing's calm, generous spacing.
 */
export function OnboardingLayout({ step, total = 5, wide = false, children }: Props) {
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-start justify-center px-4 py-12 sm:py-16">
      <div className={wide ? 'w-full max-w-6xl' : 'w-full max-w-2xl'}>
        <div className="flex items-center justify-center mb-8">
          <Link to="/" aria-label="Artemis home" className="inline-flex items-center">
            <img
              src="/assets/logo.png"
              alt="Artemis"
              className="h-9 w-auto object-contain"
            />
          </Link>
        </div>

        <div
          className={
            'rounded-3xl bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-8 ' +
            (wide ? 'p-5 sm:p-8' : 'p-6 sm:p-10')
          }
        >
          <ProgressDots current={step} total={total} />
          {children}
        </div>
      </div>
    </div>
  );
}
