import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ForgotPasswordSchema, type ForgotPasswordInput } from '@artemis/shared';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { FormError } from '@/components/ui/FormError';
import { SpinnerIcon } from '@/components/ui/icons';
import { authApi } from '@/features/auth/api';
import { extractApiError } from '@/hooks/useAuth';

/**
 * /forgot-password
 *
 * Always returns success messaging regardless of whether the email is on
 * file — the BE matches that posture to prevent account enumeration. We just
 * report "if an account exists, we sent a link". The user can re-request from
 * the same screen if the email never arrives.
 */
export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [topError, setTopError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const submit = useMutation({
    mutationFn: (input: ForgotPasswordInput) => authApi.forgotPassword(input),
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setTopError(null);
    try {
      await submit.mutateAsync(values);
      setSubmittedEmail(values.email);
    } catch (err) {
      setTopError(extractApiError(err).message);
    }
  }

  return (
    <AuthLayout>
      {submittedEmail ? (
        <div className="text-center">
          <h2 className="text-[24px] font-extrabold tracking-tight text-[#111827] mb-2">
            Check your inbox
          </h2>
          <p className="text-[15px] text-gray-600">
            If an account exists for{' '}
            <span className="font-semibold text-[#111827]">{submittedEmail}</span>, we&apos;ve sent
            a password reset link. It expires in 1 hour.
          </p>
          <p className="text-[13px] text-gray-500 mt-4">
            Didn&apos;t get it? Check spam, or{' '}
            <button
              type="button"
              onClick={() => setSubmittedEmail(null)}
              className="text-[#22c55e] font-semibold hover:underline"
            >
              try a different email
            </button>
            .
          </p>
          <p className="text-center text-[14px] text-gray-600 pt-6">
            <Link to="/signin" className="text-[#22c55e] font-semibold hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="text-center mb-2">
            <h2 className="text-[24px] font-extrabold tracking-tight text-[#111827]">
              Forgot password?
            </h2>
            <p className="text-[14px] text-gray-600 mt-1">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>
          <FormField
            id="forgot-email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          {topError ? <FormError>{topError}</FormError> : null}
          <Button
            variant="primary"
            size="lg"
            type="submit"
            disabled={isSubmitting || submit.isPending}
            className="w-full"
          >
            {isSubmitting || submit.isPending ? (
              <span className="inline-flex items-center gap-2">
                <SpinnerIcon /> Sending…
              </span>
            ) : (
              'Send reset link'
            )}
          </Button>
          <p className="text-center text-[14px] text-gray-600 pt-2">
            Remembered it?{' '}
            <Link to="/signin" className="text-[#22c55e] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
