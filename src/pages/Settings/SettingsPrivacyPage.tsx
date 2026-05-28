import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DATA_USAGE_CONSENT_VERSION } from '@artemis/shared';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { Button } from '@/components/ui/Button';
import { CheckIcon, SpinnerIcon } from '@/components/ui/icons';
import { useOnboardingState, usePatchOnboarding } from '@/hooks/useOnboarding';
import { extractApiError } from '@/hooks/useAuth';

/**
 * SETTINGS-PRIVACY — Phase 0 data-usage consent toggle.
 *
 * Lets the user opt in (or revoke) to Artemis using their CV and interview
 * content for AI improvement work (training, evals, fine-tuning). The server
 * is the source of truth for timestamp + version — the client only sends the
 * boolean via PATCH /onboarding { dataUsageConsented }.
 *
 * Per-request inference of the user's own data does not require consent;
 * only retained-for-later-use work is gated by `assertDataUsageConsent`.
 */
export default function SettingsPrivacyPage() {
  const navigate = useNavigate();
  const stateQuery = useOnboardingState();
  const patch = usePatchOnboarding();
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const consentedAt = stateQuery.data?.dataUsageConsentedAt ?? null;
  const consentVersion = stateQuery.data?.dataUsageConsentVersion ?? null;
  const consented = Boolean(consentedAt);

  async function toggle(next: boolean) {
    setError(null);
    setJustSaved(false);
    try {
      await patch.mutateAsync({ dataUsageConsented: next });
      setJustSaved(true);
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  return (
    <SettingsLayout subtitle="Choose how Artemis uses your data.">
      <div>
        <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
          Settings
        </div>
        <h1 className="mt-1 text-[28px] font-extrabold tracking-tight text-[#111827]">
          Privacy &amp; data usage
        </h1>
        <p className="mt-2 text-[15px] text-gray-600 max-w-xl">
          You&rsquo;re always in control. Artemis only uses your CV and interview content to
          improve our AI when you give us permission below — you can change your mind at any time.
        </p>
      </div>

      <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8 space-y-5">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-extrabold tracking-tight text-[#111827]">
              Help improve Artemis
            </h2>
            <p className="mt-1.5 text-[14px] text-gray-600">
              Allow Artemis to use your anonymised CV and interview data to improve our AI
              models. We never sell your data, and turning this off at any time removes you from
              future training sets.
            </p>
            {consented && consentedAt ? (
              <p className="mt-2 text-[12px] text-gray-500">
                Consented {new Date(consentedAt).toLocaleString()}
                {consentVersion ? ` · version ${consentVersion}` : ''}
              </p>
            ) : (
              <p className="mt-2 text-[12px] text-gray-500">
                Not consented · current wording version {DATA_USAGE_CONSENT_VERSION}
              </p>
            )}
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={consented}
            aria-label="Allow data usage for AI improvement"
            disabled={patch.isPending || stateQuery.isLoading}
            onClick={() => toggle(!consented)}
            className={
              'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ' +
              (consented
                ? 'border-[#15803d] bg-[#15803d]'
                : 'border-gray-300 bg-gray-200') +
              ' disabled:opacity-60'
            }
          >
            <span
              className={
                'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ' +
                (consented ? 'translate-x-6' : 'translate-x-1')
              }
            />
          </button>
        </div>

        {error ? <div className="text-[13px] text-red-600">{error}</div> : null}
        {justSaved ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-[#dcfce7] px-3 py-1 text-[12px] font-semibold text-[#15803d]">
            <CheckIcon width={14} height={14} stroke="#15803d" /> Preferences updated
          </div>
        ) : null}
        {patch.isPending ? (
          <div className="inline-flex items-center gap-2 text-[12px] text-gray-500">
            <SpinnerIcon /> Saving…
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4 pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#111827] hover:underline"
          >
            Back to home
          </Link>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Done
          </Button>
        </div>
      </section>
    </SettingsLayout>
  );
}
