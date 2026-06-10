import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckIcon } from '@/components/ui/icons';

export default function CompletePage() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = window.setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
    return () => window.clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-white ring-8 ring-[#dcfce7]">
          <CheckIcon width={36} height={36} stroke="#22c55e" />
        </div>
        <h1 className="text-[28px] sm:text-[36px] font-extrabold tracking-tight text-[#111827] leading-[1.1]">
          You&apos;re all set.
        </h1>
        <p className="text-[15px] text-gray-600">Building your dashboard…</p>
        <Link
          to="/dashboard"
          replace
          className="inline-block text-[13px] text-gray-400 underline underline-offset-2 hover:text-gray-600"
        >
          Continue to dashboard
        </Link>
      </div>
    </div>
  );
}
