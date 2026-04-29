import { AuthLayout } from '@/components/layout/AuthLayout';
import { SignInForm } from '@/components/auth/SignInForm';

export default function SignInPage() {
  return (
    <AuthLayout>
      <header className="mb-7 text-center">
        <h1 className="text-[28px] font-extrabold tracking-tight leading-[1.1] text-[#111827]">
          Welcome back
        </h1>
        <p className="mt-2 text-[15px] text-gray-600">Sign in to continue your journey.</p>
      </header>
      <SignInForm />
    </AuthLayout>
  );
}
