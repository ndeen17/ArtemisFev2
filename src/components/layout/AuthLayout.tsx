import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@/components/ui/icons';

/**
 * Auth layout — centered card layout for /signin, /signup, /verify-email,
 * /forgot-password and /reset-password. Mirrors the OnboardingLayout chrome
 * (back link on the left, brand lockup on the right) so the user keeps the
 * same orientation when bouncing between auth and onboarding.
 */
export function AuthLayout({
  children,
  backTo = '/',
}: {
  children: ReactNode;
  /** Override where the top-left back link points. Defaults to landing. */
  backTo?: string;
}) {
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-start justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 text-[14px] text-gray-500 hover:text-[#111827] transition-colors"
          >
            <ArrowLeftIcon /> Back
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[15px] font-extrabold tracking-tight text-[#111827]"
            aria-label="Artemis home"
          >
            <span
              aria-hidden="true"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-green/15 ring-1 ring-brand-green/30"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 text-brand-green"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 18 L20 6" />
                <path d="M14 6 L20 6 L20 12" />
                <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
              </svg>
            </span>
            Artemis
          </Link>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          {children}
        </div>
      </div>
    </div>
  );
}
