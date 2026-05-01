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
        <div className="relative flex items-center justify-center mb-8">
          <Link
            to={backTo}
            className="absolute left-0 inline-flex items-center gap-1.5 text-[14px] text-gray-500 hover:text-[#111827] transition-colors"
          >
            <ArrowLeftIcon /> Back
          </Link>
          <Link to="/" aria-label="Artemis home" className="inline-flex items-center">
            <img
              src="/assets/logo.png"
              alt="Artemis"
              className="h-9 w-auto object-contain"
            />
          </Link>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          {children}
        </div>
      </div>
    </div>
  );
}
