import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { SignInSchema, type SignInInput } from '@artemis/shared';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { FormError } from '@/components/ui/FormError';
import { OAuthButton } from './OAuthButton';
import { SpinnerIcon } from '@/components/ui/icons';
import { extractApiError, useGoogleAuth, useSignIn } from '@/hooks/useAuth';
import { stepToPath } from '@/store/onboardingStore';
import { getGoogleIdToken } from '@/lib/googleSignIn';
import { useState } from 'react';

/** SignInForm — mirrors SignUpForm visually so the auth surface feels symmetrical. */
export function SignInForm() {
  const navigate = useNavigate();
  const signIn = useSignIn();
  const google = useGoogleAuth();
  const [topError, setTopError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(SignInSchema),
    mode: 'onSubmit',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setTopError(null);
    try {
      const data = await signIn.mutateAsync(values);
      navigate(
        data.user.onboardingComplete
          ? '/dashboard'
          : (stepToPath[data.user.onboardingStep] ?? '/onboarding/role'),
        { replace: true },
      );
    } catch (err) {
      const apiErr = extractApiError(err);
      if (apiErr.status === 401) setTopError('Invalid email or password.');
      else if (apiErr.code === 'VALIDATION_ERROR') setTopError('Please check your details.');
      else setTopError(apiErr.message);
    }
  });

  const onGoogle = async () => {
    setTopError(null);
    try {
      const idToken = await getGoogleIdToken();
      const data = await google.mutateAsync({ idToken });
      navigate(
        data.user.onboardingComplete
          ? '/dashboard'
          : (stepToPath[data.user.onboardingStep] ?? '/onboarding/role'),
        { replace: true },
      );
    } catch (err) {
      const apiErr = extractApiError(err);
      const message =
        apiErr.message && apiErr.message !== 'Something went wrong. Please try again.'
          ? apiErr.message
          : err instanceof Error
            ? err.message
            : 'Google sign-in failed. Please try again.';
      setTopError(message);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormField
        id="signin-email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <FormField
        id="signin-password"
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="Your password"
        error={errors.password?.message}
        {...register('password')}
      />

      {topError ? <FormError>{topError}</FormError> : null}

      <Button
        variant="primary"
        size="lg"
        type="submit"
        disabled={isSubmitting || signIn.isPending}
        className="w-full"
      >
        {isSubmitting || signIn.isPending ? (
          <span className="inline-flex items-center gap-2">
            <SpinnerIcon /> Signing in...
          </span>
        ) : (
          'Sign in'
        )}
      </Button>

      <div className="relative my-2 flex items-center justify-center">
        <span className="absolute inset-x-0 top-1/2 -z-0 border-t border-gray-100" />
        <span className="relative bg-white px-3 text-[13px] text-gray-500">or</span>
      </div>

      <OAuthButton onClick={onGoogle} loading={google.isPending} />

      <p className="text-center text-[14px] text-gray-600 pt-2">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="text-[#22c55e] font-semibold hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
