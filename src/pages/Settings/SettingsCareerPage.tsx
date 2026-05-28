import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { ExperienceLevel, Role } from '@artemis/shared';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { ArrowRightIcon, SpinnerIcon, CheckIcon } from '@/components/ui/icons';
import { useOnboardingState, usePatchOnboarding } from '@/hooks/useOnboarding';
import { useProfileOverview } from '@/hooks/useProfile';
import { extractApiError } from '@/hooks/useAuth';

const ROLES: { value: Role; title: string; description: string }[] = [
  {
    value: 'software_engineer',
    title: 'Software Engineer',
    description: 'Backend, frontend, full-stack, mobile',
  },
  {
    value: 'product_manager',
    title: 'Product Manager',
    description: 'Product Owner, Delivery manager',
  },
  { value: 'designer', title: 'Digital Designer', description: 'Product, UX, Brand, Motion' },
  {
    value: 'data_analyst',
    title: 'Data Analyst',
    description: 'Analytics, BI, dashboards, SQL',
  },
];

const LEVELS: { value: ExperienceLevel; title: string; years: string }[] = [
  { value: 'student', title: 'Student / New grad', years: 'Still studying or just graduated' },
  { value: 'entry', title: 'Entry', years: '0–2 years of work experience' },
  { value: 'mid', title: 'Mid', years: '3–5 years of work experience' },
  { value: 'senior', title: 'Senior', years: '6–9 years of work experience' },
  { value: 'lead', title: 'Staff / Lead', years: '10+ years of work experience' },
];

const SELECT_CLASS =
  'block w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 pr-10 text-[14px] text-[#111827] shadow-sm transition-colors focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30 disabled:opacity-60';

function ChevronAdornment() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Settings → Career. Lets the user change role + experience level after
 * onboarding so Artemis re-calibrates suggestions, interviews, and the
 * level-mismatch banner without forcing them to start over.
 *
 * Saving here invalidates the profile overview (so the mismatch banner
 * updates) and the analysis cache. We do NOT auto-trigger a re-analysis —
 * the user picks when to spend tokens; we just nudge them via toast.
 */
export default function SettingsCareerPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const stateQuery = useOnboardingState();
  const overview = useProfileOverview();
  const patch = usePatchOnboarding();

  const [role, setRole] = useState<Role | null>(null);
  const [level, setLevel] = useState<ExperienceLevel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!stateQuery.data) return;
    if (role === null) setRole(stateQuery.data.role);
    if (level === null) setLevel(stateQuery.data.experienceLevel);
  }, [stateQuery.data, role, level]);

  const currentRole = stateQuery.data?.role ?? null;
  const currentLevel = stateQuery.data?.experienceLevel ?? null;
  const dirty =
    (role !== null && role !== currentRole) ||
    (level !== null && level !== currentLevel);

  const resolution = overview.data?.levelResolution ?? null;

  async function save() {
    if (!role || !level || !dirty) return;
    setError(null);
    setJustSaved(false);
    try {
      await patch.mutateAsync({ role, experienceLevel: level });
      await qc.invalidateQueries({ queryKey: ['profile', 'overview'] });
      await qc.invalidateQueries({ queryKey: ['analysis'] });
      setJustSaved(true);
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  return (
    <SettingsLayout subtitle="Change your role and experience level.">
      <div>
        <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
          Settings
        </div>
        <h1 className="mt-1 text-[28px] font-extrabold tracking-tight text-[#111827]">
          Career level
        </h1>
        <p className="mt-2 text-[15px] text-gray-600 max-w-xl">
          Pick the role you&apos;re targeting and how senior you are today. Artemis
          calibrates every suggestion, interview question, and gap against this — so
          a Mid candidate never gets coached to claim Staff-level scope.
        </p>
      </div>

      {resolution ? (
        <section
          aria-label="Calibration"
          className="rounded-2xl border border-gray-100 bg-surface-muted p-5"
        >
          <div className="text-[12px] font-semibold tracking-[0.12em] uppercase text-gray-500">
            What Artemis sees
          </div>
          <p className="mt-1 text-[14px] text-ink leading-snug">{resolution.explanation}</p>
          {resolution.mismatch ? (
            <p className="mt-1 text-[12.5px] text-amber-700">
              Your selected level and your CV disagree by{' '}
              {resolution.bucketDelta} steps. Saving a new level here will refresh
              your suggestions on the next re-analysis.
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-[18px] font-bold text-[#111827]">Targeting</h2>
          <p className="mt-1 text-[13px] text-gray-500">
            Calibrates every suggestion, interview question, and gap. Change these
            and re-analyse to see refreshed feedback.
          </p>
        </div>

        {/* Two-column form on desktop, stacked on mobile — the conventional
            settings shape (label + control + helper) rather than the onboarding
            tile picker. Native <select> keeps it accessible and familiar. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <Label htmlFor="settings-career-role">Target role</Label>
            <div className="relative">
              <select
                id="settings-career-role"
                className={SELECT_CLASS}
                value={role ?? ''}
                onChange={(e) => {
                  setJustSaved(false);
                  setRole(e.target.value as Role);
                }}
                disabled={patch.isPending}
              >
                <option value="" disabled>
                  Select a role…
                </option>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.title}
                  </option>
                ))}
              </select>
              <ChevronAdornment />
            </div>
            <p className="mt-1.5 text-[12.5px] text-gray-500">
              {role
                ? ROLES.find((r) => r.value === role)?.description
                : 'Pick the role family you’re aiming for now.'}
            </p>
          </div>

          <div>
            <Label htmlFor="settings-career-level">Experience level</Label>
            <div className="relative">
              <select
                id="settings-career-level"
                className={SELECT_CLASS}
                value={level ?? ''}
                onChange={(e) => {
                  setJustSaved(false);
                  setLevel(e.target.value as ExperienceLevel);
                }}
                disabled={patch.isPending}
              >
                <option value="" disabled>
                  Select a level…
                </option>
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.title}
                  </option>
                ))}
              </select>
              <ChevronAdornment />
            </div>
            <p className="mt-1.5 text-[12.5px] text-gray-500">
              {level
                ? LEVELS.find((l) => l.value === level)?.years
                : 'Pick by your work history, not your aspiration — we’ll calibrate up as your CV grows.'}
            </p>
          </div>
        </div>

        {error ? <div className="text-[13px] text-red-600">{error}</div> : null}
        {justSaved && !dirty ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-[#dcfce7] px-3 py-1 text-[12px] font-semibold text-[#15803d]">
            <CheckIcon width={14} height={14} stroke="#15803d" /> Saved — re-analyse your
            CV when you&apos;re ready to see updated suggestions.
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-100">
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
            <Button onClick={save} disabled={!role || !level || !dirty || patch.isPending}>
              {patch.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <SpinnerIcon /> Saving…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  Save changes <ArrowRightIcon />
                </span>
              )}
            </Button>
          </div>
        </div>
      </section>
    </SettingsLayout>
  );
}
