import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MailIcon, CheckIcon, SpinnerIcon } from '@/components/ui/icons';
import { useResendVerification } from '@/hooks/useAuth';

interface VerifyEmailNoticeProps {
  email?: string;
  /** When true, render the post-verification "you're verified" success card instead. */
  verified?: boolean;
}

/**
 * Card shown after sign-up (and on /verify-email without a token). Lets the
 * user request a fresh verification email and confirms when verification has succeeded.
 */
export function VerifyEmailNotice({ email, verified }: VerifyEmailNoticeProps) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const resend = useResendVerification();

  if (verified) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#dcfce7]">
          <CheckIcon />
        </div>
        <h2 className="text-[24px] font-extrabold tracking-tight text-[#111827] mb-2">
          Email verified
        </h2>
        <p className="text-[15px] text-gray-600 mb-6">
          You&apos;re all set. Continue setting up your account.
        </p>
        <Button variant="primary" size="lg" href="/onboarding/role" className="w-full">
          Continue
        </Button>
      </div>
    );
  }

  const onResend = async () => {
    if (!email) return;
    try {
      await resend.mutateAsync({ email });
      setSentTo(email);
    } catch {
      // Backend always returns OK to avoid leaking; treat any error as already-sent.
      setSentTo(email);
    }
  };

  return (
    <div className="text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#dcfce7] text-[#22c55e]">
        <MailIcon />
      </div>
      <h2 className="text-[24px] font-extrabold tracking-tight text-[#111827] mb-2">
        Verify your email
      </h2>
      <p className="text-[15px] text-gray-600 mb-6">
        {email ? (
          <>
            We sent a verification link to{' '}
            <span className="font-semibold text-[#111827]">{email}</span>. Click the link to
            activate your account.
          </>
        ) : (
          <>Check your inbox for a verification link.</>
        )}
      </p>

      {email ? (
        <button
          type="button"
          onClick={onResend}
          disabled={resend.isPending}
          className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#22c55e] hover:underline disabled:opacity-60"
        >
          {resend.isPending ? (
            <>
              <SpinnerIcon /> Sending...
            </>
          ) : (
            'Resend verification email'
          )}
        </button>
      ) : null}

      {sentTo ? (
        <p className="mt-3 text-[13px] text-gray-500">
          If that email exists, a fresh link is on its way.
        </p>
      ) : null}
    </div>
  );
}
