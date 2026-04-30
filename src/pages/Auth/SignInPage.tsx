import { useEffect } from 'react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { SignInForm } from '@/components/auth/SignInForm';
import { useAuthStore } from '@/store/authStore';

export default function SignInPage() {
  const sessionExpired = useAuthStore((s) => s.sessionExpired);
  const acknowledgeExpired = useAuthStore((s) => s.acknowledgeExpired);

  // Auto-clear the flag when the user navigates away so a subsequent visit
  // (e.g. after manual logout) doesn't show a stale banner.
  useEffect(() => {
    return () => {
      if (useAuthStore.getState().sessionExpired) {
        acknowledgeExpired();
      }
    };
  }, [acknowledgeExpired]);

  return (
    <AuthLayout>
      <header className="mb-7 text-center">
        <h1 className="text-[28px] font-extrabold tracking-tight leading-[1.1] text-[#111827]">
          Welcome back
        </h1>
        <p className="mt-2 text-[15px] text-gray-600">Sign in to continue your journey.</p>
      </header>

      {sessionExpired ? (
        <div
          role="status"
          className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900"
        >
          <div>
            <p className="font-semibold">Your session expired.</p>
            <p className="mt-0.5 text-[12.5px]">
              For your security we signed you out after a long period of inactivity. Please sign
              in again to continue.
            </p>
          </div>
          <button
            type="button"
            onClick={acknowledgeExpired}
            aria-label="Dismiss"
            className="shrink-0 text-amber-700 hover:text-amber-900 text-[16px] leading-none"
          >
            ×
          </button>
        </div>
      ) : null}

      <SignInForm />
    </AuthLayout>
  );
}
