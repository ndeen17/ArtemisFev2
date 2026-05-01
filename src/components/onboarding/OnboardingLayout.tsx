import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ProgressDots } from './StepHeader';
import { ArrowLeftIcon } from '@/components/ui/icons';

interface Props {
  step: number;
  total?: number;
  backTo?: string;
  /** Use a wider container — useful for the multi-pane CV editor step. */
  wide?: boolean;
  children: ReactNode;
}

/**
 * Frame around every onboarding page — soft cream background, centered card with
 * progress, and an optional back link. Mirrors the landing's calm, generous spacing.
 */
export function OnboardingLayout({ step, total = 5, backTo, wide = false, children }: Props) {
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-start justify-center px-4 py-12 sm:py-16">
      <div className={wide ? 'w-full max-w-6xl' : 'w-full max-w-2xl'}>
        <div className="relative flex items-center justify-center mb-8">
          {backTo ? (
            <Link
              to={backTo}
              className="absolute left-0 inline-flex items-center gap-1.5 text-[14px] text-gray-500 hover:text-[#111827] transition-colors"
            >
              <ArrowLeftIcon /> Back
            </Link>
          ) : null}
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 text-[20px] font-extrabold tracking-tight text-[#111827]"
            aria-label="Artemis home"
          >
            <span
              aria-hidden="true"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-green shadow-sm"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 7 L17 17" />
                <path d="M17 7 L7 17" />
                <path d="M14 7 L17 7 L17 10" />
              </svg>
            </span>
            Artemis
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
