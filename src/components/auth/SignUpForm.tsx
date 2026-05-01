import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { SignUpSchema, type SignUpInput } from '@artemis/shared';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { PasswordField } from '@/components/ui/PasswordField';
import { FormError } from '@/components/ui/FormError';
import { OAuthButton } from './OAuthButton';
import { SpinnerIcon } from '@/components/ui/icons';
import { extractApiError, useGoogleAuth, useSignUp } from '@/hooks/useAuth';
import { stepToPath } from '@/store/onboardingStore';
import { getGoogleIdToken } from '@/lib/googleSignIn';
import { useState } from 'react';

/** SignUpForm — email + password + Google. Wired to /auth/signup and /auth/google. */
export function SignUpForm() {
  const navigate = useNavigate();
  const signUp = useSignUp();
  const google = useGoogleAuth();
  const [topError, setTopError] = useState<{ message: string; isDuplicate?: boolean } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(SignUpSchema),
    mode: 'onSubmit',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setTopError(null);
    try {
      const data = await signUp.mutateAsync(values);
      const dest = data.user.onboardingComplete
        ? '/dashboard'
        : (stepToPath[data.user.onboardingStep] ?? '/onboarding/role');
      navigate(dest, { replace: true });
    } catch (err) {
      const apiErr = extractApiError(err);
      if (apiErr.status === 409) {
        setTopError({ message: 'Email already in use.', isDuplicate: true });
      } else if (apiErr.code === 'VALIDATION_ERROR') {
        setTopError({ message: 'Please check your details and try again.' });
      } else {
        setTopError({ message: apiErr.message });
      }
    }
  });

  // Google Identity Services flow: request an ID token, POST to /auth/google.
  const onGoogle = async () => {
    setTopError(null);
    try {
      const idToken = await getGoogleIdToken();
      const data = await google.mutateAsync({ idToken });
      const dest = data.user.onboardingComplete
        ? '/dashboard'
        : (stepToPath[data.user.onboardingStep] ?? '/onboarding/role');
      navigate(dest, { replace: true });
    } catch (err) {
      const apiErr = extractApiError(err);
      const message =
        apiErr.message && apiErr.message !== 'Something went wrong. Please try again.'
          ? apiErr.message
          : err instanceof Error
            ? err.message
            : 'Google sign-up failed. Please try again.';
      setTopError({ message });
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <FormField
        id="signup-email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordField
        id="signup-password"
        label="Password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        error={errors.password?.message}
        hint="8+ characters with a letter and a number."
        {...register('password')}
      />

      {topError ? (
        <FormError>
          {topError.message}{' '}
          {topError.isDuplicate ? (
            <Link to="/signin" className="text-[#22c55e] font-semibold hover:underline ml-1">
              Sign in instead
            </Link>
          ) : null}
        </FormError>
      ) : null}

      <Button
        variant="primary"
        size="lg"
        type="submit"
        disabled={isSubmitting || signUp.isPending}
        className="w-full"
      >
        {isSubmitting || signUp.isPending ? (
          <span className="inline-flex items-center gap-2">
            <SpinnerIcon /> Creating account...
          </span>
        ) : (
          'Create account'
        )}
      </Button>

      <div className="relative my-2 flex items-center justify-center">
        <span className="absolute inset-x-0 top-1/2 -z-0 border-t border-gray-100" />
        <span className="relative bg-white px-3 text-[13px] text-gray-500">or</span>
      </div>

      <OAuthButton onClick={onGoogle} loading={google.isPending} />

      <p className="text-center text-[14px] text-gray-600 pt-2">
        Already have an account?{' '}
        <Link to="/signin" className="text-[#22c55e] font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
