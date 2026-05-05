import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { ArrowRightIcon, SpinnerIcon, CheckIcon } from '@/components/ui/icons';
import { useOnboardingState, usePatchOnboarding } from '@/hooks/useOnboarding';
import { useAuthStore } from '@/store/authStore';
import { extractApiError, useLogout } from '@/hooks/useAuth';

/**
 * SETTINGS-PROFILE — change the display name shown across the app
 * (dashboard greeting, navbar, etc.). Persists via PATCH /onboarding which
 * writes `displayName` straight onto the user document. The auth store is
 * mirrored on success so the new name is visible without a refresh.
 */
export default function SettingsProfilePage() {
  const navigate = useNavigate();
  const stateQuery = useOnboardingState();
  const patch = usePatchOnboarding();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const logout = useLogout();

  useEffect(() => {
    const seed = stateQuery.data?.displayName ?? user?.displayName ?? '';
    if (seed && name === '') setName(seed);
  }, [stateQuery.data?.displayName, user?.displayName, name]);

  const trimmed = name.trim();
  const current = stateQuery.data?.displayName ?? user?.displayName ?? '';
  const dirty = trimmed.length >= 2 && trimmed !== current;

  async function save() {
    if (!dirty) return;
    setError(null);
    setJustSaved(false);
    try {
      const next = await patch.mutateAsync({ displayName: trimmed });
      if (user) setUser({ ...user, displayName: next.displayName ?? trimmed });
      setJustSaved(true);
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  return (
    <SettingsLayout subtitle="Update what we call you across the app.">
      <div>
        <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
          Settings
        </div>
        <h1 className="mt-1 text-[28px] font-extrabold tracking-tight text-[#111827]">
          Your name
        </h1>
        <p className="mt-2 text-[15px] text-gray-600 max-w-xl">
          We use this to greet you on the dashboard and across the app. You can change it any time.
        </p>
      </div>

      <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8 space-y-5">
        <FormField
          id="settings-name"
          label="Display name"
          placeholder="Jane"
          autoComplete="given-name"
          value={name}
          onChange={(e) => {
            setJustSaved(false);
            setName(e.target.value);
          }}
          hint="Two characters or more. Visible only to you."
          error={
            trimmed.length > 0 && trimmed.length < 2
              ? 'Name must be at least 2 characters.'
              : undefined
          }
        />

        {error ? <div className="text-[13px] text-red-600">{error}</div> : null}
        {justSaved && !dirty ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-[#dcfce7] px-3 py-1 text-[12px] font-semibold text-[#15803d]">
            <CheckIcon width={14} height={14} stroke="#15803d" /> Saved
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4 pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#111827] hover:underline"
          >
            Back to home
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              disabled={patch.isPending}
            >
              Cancel
            </Button>
            <Button onClick={save} disabled={!dirty || patch.isPending}>
              {patch.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <SpinnerIcon /> Saving…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  Save name <ArrowRightIcon />
                </span>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* Account — sign-out lives here (was previously in the global TopBar).
          Centralising it keeps the topbar quiet and gives users a predictable
          home for account-level controls (future: change password, delete
          account, export data). */}
      <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8 space-y-4">
        <div>
          <h2 className="text-[18px] font-extrabold tracking-tight text-[#111827]">Account</h2>
          <p className="mt-1 text-[14px] text-gray-600">
            Signed in as <span className="font-semibold text-[#111827]">{user?.email}</span>.
          </p>
        </div>
        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            {logout.isPending ? (
              <span className="inline-flex items-center gap-2">
                <SpinnerIcon /> Signing out…
              </span>
            ) : (
              'Sign out'
            )}
          </Button>
        </div>
      </section>
    </SettingsLayout>
  );
}
