import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PasswordSchema } from '@artemis/shared';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/ui/PasswordField';
import { FormError } from '@/components/ui/FormError';
import { SpinnerIcon } from '@/components/ui/icons';
import { authApi } from '@/features/auth/api';
import { extractApiError } from '@/hooks/useAuth';

const ResetFormSchema = z
  .object({
    newPassword: PasswordSchema,
    confirm: z.string().min(1, 'Confirm your password'),
  })
  .refine((v) => v.newPassword === v.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });
type ResetFormValues = z.infer<typeof ResetFormSchema>;

/**
 * /reset-password/:token
 *
 * On mount we GET /auth/reset-password/:token/check so we can show a friendly
 * "this link is expired" page (ONB-FIX-02) before the user types anything.
 * On submit we POST the new password; on success the BE has already revoked
 * any active sessions for the account, so we route the user back to /signin.
 */
export default function ResetPasswordPage() {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [tokenStatus, setTokenStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [topError, setTopError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setTokenStatus('invalid');
      return;
    }
    authApi
      .checkResetToken(token)
      .then((r) => {
        if (cancelled) return;
        setTokenStatus(r.valid ? 'valid' : 'invalid');
      })
      .catch(() => {
        if (!cancelled) setTokenStatus('invalid');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(ResetFormSchema),
    defaultValues: { newPassword: '', confirm: '' },
  });

  const submit = useMutation({
    mutationFn: (newPassword: string) => authApi.resetPassword({ token, newPassword }),
  });

  async function onSubmit(values: ResetFormValues) {
    setTopError(null);
    try {
      await submit.mutateAsync(values.newPassword);
      setDone(true);
    } catch (err) {
      const apiErr = extractApiError(err);
      // Token may have expired between the initial check and submit (rare but
      // possible). Surface the error inline; the user can request a new link.
      if (apiErr.status === 401) {
        setTokenStatus('invalid');
      } else {
        setTopError(apiErr.message);
      }
    }
  }

  if (tokenStatus === 'checking') {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center text-center py-6">
          <SpinnerIcon className="text-[#22c55e]" />
          <p className="mt-3 text-[15px] text-gray-600">Checking your reset link…</p>
        </div>
      </AuthLayout>
    );
  }

  if (tokenStatus === 'invalid') {
    return (
      <AuthLayout>
        <div className="text-center">
          <h2 className="text-[24px] font-extrabold tracking-tight text-[#111827] mb-2">
            This reset link is no longer valid
          </h2>
          <p className="text-[15px] text-gray-600 mb-6">
            Reset links expire after 1 hour, and each can only be used once. Request a new one and
            we&apos;ll send a fresh link to your inbox.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/forgot-password')}
            className="w-full"
          >
            Request a new reset link
          </Button>
          <p className="text-center text-[14px] text-gray-600 pt-4">
            <Link to="/signin" className="text-[#22c55e] font-semibold hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout>
        <div className="text-center">
          <h2 className="text-[24px] font-extrabold tracking-tight text-[#111827] mb-2">
            Password updated
          </h2>
          <p className="text-[15px] text-gray-600 mb-6">
            Sign in with your new password. For your security, any other sessions have been signed
            out.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/signin')}
            className="w-full"
          >
            Sign in
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="text-center mb-2">
          <h2 className="text-[24px] font-extrabold tracking-tight text-[#111827]">
            Choose a new password
          </h2>
          <p className="text-[14px] text-gray-600 mt-1">
            At least 8 characters with one letter and one number.
          </p>
        </div>
        <PasswordField
          id="reset-password"
          label="New password"
          autoComplete="new-password"
          placeholder="New password"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <PasswordField
          id="reset-confirm"
          label="Confirm new password"
          autoComplete="new-password"
          placeholder="Re-enter password"
          error={errors.confirm?.message}
          {...register('confirm')}
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
              <SpinnerIcon /> Updating…
            </span>
          ) : (
            'Update password'
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
