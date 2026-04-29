import type { ReactNode } from 'react';

/**
 * Auth layout — centered card layout for /signin, /signup, /verify-email.
 * Phase 1 will populate this with the auth forms.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        {children}
      </div>
    </div>
  );
}
