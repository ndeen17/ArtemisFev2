import { AuthLayout } from '@/components/layout/AuthLayout';
import { SignUpForm } from '@/components/auth/SignUpForm';

export default function SignUpPage() {
  return (
    <AuthLayout>
      <header className="mb-7 text-center">
        <h1 className="text-[28px] font-extrabold tracking-tight leading-[1.1] text-[#111827]">
          Create your account
        </h1>
        <p className="mt-2 text-[15px] text-gray-600">
          Land the job, not just another application.
        </p>
      </header>
      <SignUpForm />
    </AuthLayout>
  );
}
