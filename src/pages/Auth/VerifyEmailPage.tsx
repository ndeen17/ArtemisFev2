import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { VerifyEmailNotice } from '@/components/auth/VerifyEmailNotice';
import { SpinnerIcon } from '@/components/ui/icons';
import { useVerifyEmail } from '@/hooks/useAuth';

/**
 * /verify-email
 * - With `?token=...` we POST to /auth/verify-email and show success/error.
 * - Without a token we render the "check your inbox + resend" notice.
 *   The signed-in user's email (if available) is read from the auth store.
 */
export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const emailParam = params.get('email') ?? undefined;
  const verify = useVerifyEmail();
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>(
    token ? 'verifying' : 'idle',
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    verify
      .mutateAsync({ token })
      .then(() => !cancelled && setStatus('verified'))
      .catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthLayout>
      {status === 'verifying' ? (
        <div className="flex flex-col items-center text-center py-6">
          <SpinnerIcon className="text-[#22c55e]" />
          <p className="mt-3 text-[15px] text-gray-600">Verifying your email...</p>
        </div>
      ) : status === 'error' ? (
        <div className="text-center">
          <h2 className="text-[24px] font-extrabold tracking-tight text-[#111827] mb-2">
            Link invalid or expired
          </h2>
          <p className="text-[15px] text-gray-600 mb-6">Request a new verification email below.</p>
          <VerifyEmailNotice email={emailParam} />
        </div>
      ) : status === 'verified' ? (
        <VerifyEmailNotice verified />
      ) : (
        <VerifyEmailNotice email={emailParam} />
      )}
    </AuthLayout>
  );
}
