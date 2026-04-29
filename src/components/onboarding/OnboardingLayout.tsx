import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ProgressDots } from './StepHeader';
import { ArrowLeftIcon } from '@/components/ui/icons';

interface Props {
  step: number;
  total?: number;
  backTo?: string;
  children: ReactNode;
}

/**
 * Frame around every onboarding page — soft cream background, centered card with
 * progress, and an optional back link. Mirrors the landing's calm, generous spacing.
 */
export function OnboardingLayout({ step, total = 5, backTo, children }: Props) {
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-start justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          {backTo ? (
            <Link
              to={backTo}
              className="inline-flex items-center gap-1.5 text-[14px] text-gray-500 hover:text-[#111827] transition-colors"
            >
              <ArrowLeftIcon /> Back
            </Link>
          ) : (
            <span />
          )}
          <Link
            to="/"
            className="text-[15px] font-extrabold tracking-tight text-[#111827]"
            aria-label="Artemis home"
          >
            Artemis
          </Link>
        </div>

        <div className="rounded-3xl bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-10 space-y-8">
          <ProgressDots current={step} total={total} />
          {children}
        </div>
      </div>
    </div>
  );
}
