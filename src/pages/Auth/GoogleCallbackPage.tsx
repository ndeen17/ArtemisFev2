import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { SpinnerIcon } from '@/components/ui/icons';

/**
 * /auth/callback/google
 * Placeholder for Phase 1 — full Google Identity Services wiring will land in a follow-up
 * pass once the GOOGLE_CLIENT_ID is configured. Today this page handles the cancellation
 * branch (`?error=access_denied` → redirect to /signup) so the unhappy path is covered.
 */
export default function GoogleCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const error = params.get('error');
    if (error) {
      navigate('/signup', { replace: true, state: { oauthCancelled: true } });
      return;
    }
    // No id_token / code handling yet. Bounce back to /signin so the user isn't stuck.
    navigate('/signin', { replace: true });
  }, [params, navigate]);

  return (
    <AuthLayout>
      <div className="flex flex-col items-center text-center py-6">
        <SpinnerIcon className="text-[#22c55e]" />
        <p className="mt-3 text-[15px] text-gray-600">Finishing Google sign-in...</p>
      </div>
    </AuthLayout>
  );
}
