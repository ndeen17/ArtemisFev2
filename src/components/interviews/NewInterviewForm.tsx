import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreateInterviewSchema,
  INTERVIEW_MATRIX,
  INTERVIEW_SOURCES,
  INTERVIEW_SOURCE_LABELS,
  INTERVIEW_TYPE_LABELS,
  type CreateInterviewInput,
  type InterviewMode,
  type InterviewSource,
  type InterviewType,
} from '@artemis/shared';
import { Button } from '@/components/ui/Button';
import { useApplications } from '@/hooks/useApplications';
import { useCreateInterview, useVoiceQuota } from '@/hooks/useInterviews';

/**
 * Phase 8B — New interview form. Picks source × type, hydrates required fields
 * (applicationId / jdText / role / company) and calls the BE which generates the brief.
 * The created session lands at status='briefed' and we route into the detail page.
 */
export function NewInterviewForm() {
  const navigate = useNavigate();
  const create = useCreateInterview();
  const apps = useApplications();

  // dashboard_cta is the "deep link from dashboard" surface — not user-pickable here.
  const sourceOptions = useMemo(
    () => INTERVIEW_SOURCES.filter((s) => s !== 'dashboard_cta'),
    [],
  );

  const [source, setSource] = useState<InterviewSource>('role_only');
  const [type, setType] = useState<InterviewType>('behavioral');
  const [mode, setMode] = useState<InterviewMode>('text');
  const [applicationId, setApplicationId] = useState<string>('');
  const [jdText, setJdText] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState<string | null>(null);
  const voiceQuota = useVoiceQuota();

  // When source changes, snap type to a still-valid option.
  useEffect(() => {
    const allowed = INTERVIEW_MATRIX[source];
    if (!allowed.includes(type)) setType(allowed[0]);
  }, [source, type]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const payload: Record<string, unknown> = { source, type, mode };
    if (source === 'application') payload.applicationId = applicationId || undefined;
    if (source === 'jd_paste') payload.jdText = jdText.trim() || undefined;
    if (role.trim()) payload.role = role.trim();
    if (company.trim()) payload.company = company.trim();

    const parsed = CreateInterviewSchema.safeParse(payload satisfies Record<string, unknown>);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please review the fields.');
      return;
    }
    try {
      const interview = await create.mutateAsync(parsed.data as CreateInterviewInput);
      navigate(`/interviews/${interview.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('LIVE_SESSION_EXISTS')) {
        setError('You already have an interview in progress. Finish or end it first.');
      } else if (msg.includes('NO_ANALYSIS')) {
        setError('Run a CV analysis on your Profile before drilling weaknesses.');
      } else if (msg.includes('VOICE_CAP_EXCEEDED')) {
        setError('You have used today’s 60 minutes of voice practice. Try again tomorrow.');
      } else {
        setError('Could not create interview. Try again.');
      }
    }
  }

  const allowedTypes = INTERVIEW_MATRIX[source];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-[12px] font-semibold text-gray-600">Source</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {sourceOptions.map((s) => (
            <label
              key={s}
              className={`cursor-pointer rounded-2xl border px-4 py-3 text-[13px] transition ${
                source === s
                  ? 'border-[#15803d] bg-[#dcfce7] text-[#15803d] font-semibold'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="source"
                value={s}
                checked={source === s}
                onChange={() => setSource(s)}
                className="sr-only"
              />
              {INTERVIEW_SOURCE_LABELS[s]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-[12px] font-semibold text-gray-600">Interview type</legend>
        <div className="flex flex-wrap gap-2">
          {allowedTypes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
                type === t
                  ? 'border-[#111827] bg-[#111827] text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {INTERVIEW_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-[12px] font-semibold text-gray-600">Mode</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(['text', 'voice'] as const).map((m) => {
            const isVoice = m === 'voice';
            const remainingMin = voiceQuota.data
              ? Math.floor(voiceQuota.data.remainingSec / 60)
              : null;
            const voiceDisabled = isVoice && remainingMin === 0;
            return (
              <label
                key={m}
                className={`relative cursor-pointer rounded-2xl border px-4 py-3 text-[13px] transition ${
                  mode === m
                    ? 'border-[#15803d] bg-[#dcfce7] text-[#15803d] font-semibold'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                } ${voiceDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="mode"
                  value={m}
                  checked={mode === m}
                  disabled={voiceDisabled}
                  onChange={() => setMode(m)}
                  className="sr-only"
                />
                <div className="font-semibold">{isVoice ? 'Voice' : 'Text'}</div>
                <div className="text-[11px] font-normal opacity-80">
                  {isVoice
                    ? remainingMin == null
                      ? 'Realtime spoken interview'
                      : `${remainingMin} min left today (60 min/day cap)`
                    : 'Type your answers in chat'}
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>

      {source === 'application' && (
        <label className="block">
          <span className="text-[12px] font-semibold text-gray-600">Application</span>
          <select
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-[14px]"
          >
            <option value="">Select an application…</option>
            {(apps.data ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.jobTitle} — {a.company}
              </option>
            ))}
          </select>
          {(apps.data ?? []).length === 0 && !apps.isLoading && (
            <span className="mt-1 block text-[11px] text-gray-400">
              No saved applications yet. Add one from /applications.
            </span>
          )}
        </label>
      )}

      {source === 'jd_paste' && (
        <label className="block">
          <span className="text-[12px] font-semibold text-gray-600">Job description</span>
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            rows={8}
            className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 text-[14px] leading-relaxed"
            placeholder="Paste the JD here…"
          />
          <span className="mt-1 block text-[11px] text-gray-400">
            {jdText.trim().length} chars · min 20
          </span>
        </label>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-[12px] font-semibold text-gray-600">
            Role <span className="font-normal text-gray-400">(optional)</span>
          </span>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-[14px]"
            placeholder="Senior Software Engineer"
          />
        </label>
        <label className="block">
          <span className="text-[12px] font-semibold text-gray-600">
            Company <span className="font-normal text-gray-400">(optional)</span>
          </span>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-[14px]"
            placeholder="Acme"
          />
        </label>
      </div>

      {error && <p className="text-[13px] text-rose-600">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? 'Generating brief…' : 'Generate brief'}
        </Button>
        <Button type="button" variant="ghost" href="/interviews">
          Cancel
        </Button>
      </div>
    </form>
  );
}
