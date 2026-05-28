import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  StructuredCv,
  StructuredCvExperience,
  StructuredCvEducation,
  CvCoachSection,
} from '@artemis/shared';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import { SpinnerIcon } from '@/components/ui/icons';
import { CvPreview } from './CvPreview';
import { CvCoachChat } from './CvCoachChat';
import { RewriteDrawer } from '@/components/profile/RewriteDrawer';
import { sectionStatus, type SectionStatus } from '@/lib/cv/sectionValidity';
import { cn } from '@/lib/cn';

/**
 * CvEditor — Phase-5 interactive CV builder.
 *
 * Layout:
 *   ┌────────┬───────────────────┬────────────────────┐
 *   │ Steps  │ Active section    │ Live preview       │
 *   │ (left) │ form (centre)     │ (right)            │
 *   └────────┴───────────────────┴────────────────────┘
 *
 * Editing is local; parent owns the canonical state via `value` + `onChange`.
 * Save / Continue buttons are rendered by the parent so onboarding vs profile
 * surfaces can wire different next-step routes.
 */
type Section = 'header' | 'summary' | 'experience' | 'education' | 'skills';
const SECTIONS: { id: Section; label: string; coachSection: CvCoachSection }[] = [
  { id: 'header', label: 'Header', coachSection: 'header' },
  { id: 'summary', label: 'Summary', coachSection: 'summary' },
  { id: 'experience', label: 'Experience', coachSection: 'experience' },
  { id: 'education', label: 'Education', coachSection: 'education' },
  { id: 'skills', label: 'Skills', coachSection: 'skills' },
];

export interface CvEditorProps {
  value: StructuredCv;
  onChange: (next: StructuredCv) => void;
  /** When provided, enables per-bullet "Rewrite" links that open the targeted
   *  rewrite drawer. Without it, rewrite affordances are hidden. */
  cvId?: string;
  /** Optional initial section to focus on mount. Used by ?focus=<actionId> to
   *  jump the user straight to the relevant tab from the action plan. */
  initialSection?: Section;
  /** Optional CV item id (StructuredCvExperience.id or StructuredCvEducation.id)
   *  to scroll to and flash inside the active section. Used by the action plan
   *  deep-link flow so "Fix in builder" lands on the exact role/qualification
   *  the finding refers to instead of just the section panel. */
  focusItemId?: string | null;
  /** Optional 0-based bullet index inside the targeted Experience role.
   *  Only meaningful when `focusItemId` resolves to an experience row.
   *  Drives bullet-textarea-level scroll + focus + ring-flash. */
  focusBulletIndex?: number | null;
  /** Optional named-field hint for non-itemised sections. In the Header form
   *  this is one of `'fullName' | 'email' | 'headline' | 'location' |
   *  'phone' | 'linkedin' | 'website'`. Drives input-level scroll + focus +
   *  ring-flash so rubric items like `header_complete` can land the user on
   *  the exact empty input. */
  focusField?: string | null;
  /** When provided, renders a per-section "Save section" button. Parents wire
   *  this to a partial patch so users get explicit confirmation that the
   *  current section persisted, without having to commit the whole CV. */
  onSaveSection?: (section: Section, cv: StructuredCv) => Promise<void>;
  /** When provided, the "Preview" button navigates here instead of opening
   *  an in-component drawer. Used by the inline builder so we never stack
   *  the form and the preview in the same SplitPaneShell column (which on
   *  smaller xl viewports would force them to overlap). */
  onPreview?: () => void;
}

export function CvEditor({
  value,
  onChange,
  cvId,
  initialSection,
  focusItemId,
  focusBulletIndex,
  focusField,
  onSaveSection,
  onPreview,
}: CvEditorProps) {
  const [active, setActive] = useState<Section>(initialSection ?? 'header');
  const [coachOpen, setCoachOpen] = useState<boolean>(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [savingSection, setSavingSection] = useState<Section | null>(null);
  const [savedSection, setSavedSection] = useState<Section | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [flashing, setFlashing] = useState(false);
  const formPanelRef = useRef<HTMLDivElement | null>(null);
  const activeMeta = SECTIONS.find((s) => s.id === active)!;

  // Compute completeness once per render so the tab dots and the section
  // panel can read from the same source of truth.
  const statusById = useMemo(() => {
    const out: Record<Section, SectionStatus> = {
      header: sectionStatus('header', value),
      summary: sectionStatus('summary', value),
      experience: sectionStatus('experience', value),
      education: sectionStatus('education', value),
      skills: sectionStatus('skills', value),
    };
    return out;
  }, [value]);

  async function handleSaveSection() {
    if (!onSaveSection || savingSection) return;
    setSaveError(null);
    setSavingSection(active);
    try {
      await onSaveSection(active, value);
      setSavedSection(active);
      // Auto-clear the "Saved" affordance after a short beat so the next
      // edit feels fresh. The user can also dismiss by editing further.
      window.setTimeout(() => {
        setSavedSection((cur) => (cur === active ? null : cur));
      }, 2400);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save this section.';
      setSaveError(message);
    } finally {
      setSavingSection(null);
    }
  }

  // Clear the transient "Saved" pip whenever the user switches sections or
  // makes further edits to the active section.
  useEffect(() => {
    setSavedSection(null);
    setSaveError(null);
  }, [active]);

  // If the parent updates initialSection (e.g. ?focus=<id> resolved late), respect it.
  useEffect(() => {
    if (initialSection) setActive(initialSection);
  }, [initialSection]);

  // Flash the form panel for ~1.5s whenever the focused section changes from
  // outside (Fix-in-builder click). Gives the user an unmistakable visual
  // cue about where the change has landed inside the editor.
  useEffect(() => {
    if (!initialSection) return;
    setFlashing(true);
    // On small screens the editor sits below the page header, so when the
    // builder opens as a sheet we also scroll the form panel into view so
    // the user doesn't have to hunt for it.
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        formPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    const handle = window.setTimeout(() => setFlashing(false), 1500);
    return () => window.clearTimeout(handle);
  }, [initialSection]);

  return (
    <div className="space-y-6">
      {/* Top: horizontal section tab bar (always horizontal, scrolls on mobile) */}
      <nav
        aria-label="CV sections"
        className="-mx-1 overflow-x-auto"
      >
        <ol className="flex items-center gap-2 px-1 min-w-max">
          {SECTIONS.map((s, i) => {
            const isActive = s.id === active;
            const status = statusById[s.id];
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setActive(s.id)}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`${s.label} — ${statusLabel(status)}`}
                  className={cn(
                    'inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors whitespace-nowrap',
                    isActive
                      ? 'bg-brand-green text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold',
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600',
                    )}
                  >
                    {i + 1}
                  </span>
                  {s.label}
                  <span
                    aria-hidden
                    className={cn(
                      'inline-block w-1.5 h-1.5 rounded-full',
                      statusDotClass(status, isActive),
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Body: single column. The form gets the full builder pane width so
          the editor never has to share space with the preview (the preview
          lives on its own dedicated route — see `onPreview`). */}
      <div className="grid grid-cols-1 gap-6">
        {/* Form column */}
        <section className="space-y-4 min-w-0">
          <div
            ref={formPanelRef}
            className={cn(
              'rounded-3xl border bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-700',
              flashing
                ? 'border-brand-green ring-2 ring-brand-green/30'
                : 'border-gray-100',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[20px] font-semibold tracking-tight">
                  {sectionTitle(active)}
                </h3>
                <p className="mt-1 text-[13.5px] text-gray-500">{sectionHint(active)}</p>
              </div>
              <button
                type="button"
                onClick={() => (onPreview ? onPreview() : setPreviewOpen(true))}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-gray-700 hover:bg-gray-50"
              >
                Preview
              </button>
            </div>
            <div className="mt-6">
              {active === 'header' ? <HeaderForm value={value} onChange={onChange} focusField={focusField} /> : null}
              {active === 'summary' ? <SummaryForm value={value} onChange={onChange} /> : null}
              {active === 'experience' ? (
                <ExperienceForm value={value} onChange={onChange} cvId={cvId} focusItemId={focusItemId} focusBulletIndex={focusBulletIndex} />
              ) : null}
              {active === 'education' ? (
                <EducationForm value={value} onChange={onChange} focusItemId={focusItemId} />
              ) : null}
              {active === 'skills' ? <SkillsForm value={value} onChange={onChange} /> : null}
            </div>
            {onSaveSection ? (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <div className="min-h-[20px] text-[12.5px]">
                  {saveError ? (
                    <span className="text-red-600">{saveError}</span>
                  ) : savedSection === active ? (
                    <span className="inline-flex items-center gap-1.5 text-[#065f46]">
                      <span aria-hidden>✓</span>
                      <span>Saved</span>
                    </span>
                  ) : (
                    <span className="text-gray-400">
                      Saving keeps your progress without leaving this step.
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveSection}
                  disabled={savingSection !== null}
                >
                  {savingSection === active ? (
                    <span className="inline-flex items-center gap-2">
                      <SpinnerIcon /> Saving…
                    </span>
                  ) : (
                    'Save section'
                  )}
                </Button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setCoachOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl border border-brand-green/30 bg-brand-green/5 px-4 py-3 text-left text-[13.5px] text-[#065f46] hover:bg-brand-green/10"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden>✨</span>
              <span>Need help with this section? Ask the AI coach.</span>
            </span>
            <span className="text-[12px] font-semibold whitespace-nowrap">Open chat →</span>
          </button>
        </section>
      </div>

      {/* Fallback in-component preview drawer — only used when no `onPreview`
          handler is wired. The inline builder always passes one, so this is
          just a safety net for any host that embeds CvEditor outside the
          SplitPaneShell flow. */}
      {previewOpen && !onPreview ? (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setPreviewOpen(false)}
            aria-hidden
          />
          <div className="relative ml-auto h-full w-full max-w-[560px] bg-gray-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
              <div className="text-[14px] font-semibold">Live preview</div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="text-gray-500 hover:text-gray-800"
                aria-label="Close preview"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <CvPreview cv={value} />
            </div>
          </div>
        </div>
      ) : null}

      {coachOpen ? (
        <CvCoachChat
          cv={value}
          section={activeMeta.coachSection}
          onClose={() => setCoachOpen(false)}
        />
      ) : null}
    </div>
  );
}

function sectionTitle(s: Section): string {
  switch (s) {
    case 'header':
      return "Let's start with your header";
    case 'summary':
      return 'Your professional summary';
    case 'experience':
      return 'Work experience';
    case 'education':
      return 'Education';
    case 'skills':
      return 'Skills';
  }
}

function sectionHint(s: Section): string {
  switch (s) {
    case 'header':
      return 'Include your full name and ways for employers to reach you.';
    case 'summary':
      return 'Two to four sentences capturing who you are and what you bring.';
    case 'experience':
      return 'Lead each role with the strongest achievement you can quantify.';
    case 'education':
      return 'Add the qualifications most relevant to your target roles.';
    case 'skills':
      return 'Comma-separate or press Enter to add. Stay focused on the strongest 8–15.';
  }
}

// ---------- Section forms ----------

function HeaderForm({
  value,
  onChange,
  focusField,
}: CvEditorProps & { focusField?: string | null }) {
  const set = <K extends keyof StructuredCv['header']>(k: K, v: StructuredCv['header'][K]) =>
    onChange({ ...value, header: { ...value.header, [k]: v } });
  const f = value.header;

  // Field-level deep-link: when ?field=<name> is in the URL we register a ref
  // per input and, after first paint, scroll & flash the matching field so
  // "Fix in builder" lands the user on the exact empty input (e.g.
  // header_complete rubric pinning to the first missing field).
  const fieldRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());
  const [flashField, setFlashField] = useState<string | null>(null);
  useEffect(() => {
    if (!focusField) return;
    const raf = window.requestAnimationFrame(() => {
      const el = fieldRefs.current.get(focusField);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
      setFlashField(focusField);
    });
    const handle = window.setTimeout(() => setFlashField(null), 2200);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(handle);
    };
  }, [focusField]);

  const ringFor = (key: string) =>
    flashField === key ? 'ring-2 ring-brand-green ring-offset-2 ring-offset-white' : '';
  const registerRef = (key: string) => (el: HTMLInputElement | null) => {
    fieldRefs.current.set(key, el);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Full name" required>
        <Input
          ref={registerRef('fullName')}
          id="header-field-fullName"
          data-field="fullName"
          value={f.fullName}
          onChange={(e) => set('fullName', e.target.value)}
          aria-required="true"
          className={ringFor('fullName')}
        />
      </Field>
      <Field label="Headline" optional>
        <Input
          ref={registerRef('headline')}
          id="header-field-headline"
          data-field="headline"
          placeholder="Senior Frontend Engineer"
          value={f.headline}
          onChange={(e) => set('headline', e.target.value)}
          className={ringFor('headline')}
        />
      </Field>
      <Field label="Email">
        <Input
          ref={registerRef('email')}
          id="header-field-email"
          data-field="email"
          type="email"
          value={f.email}
          onChange={(e) => set('email', e.target.value)}
          className={ringFor('email')}
        />
      </Field>
      <Field label="Phone">
        <Input
          ref={registerRef('phone')}
          id="header-field-phone"
          data-field="phone"
          value={f.phone}
          onChange={(e) => set('phone', e.target.value)}
          className={ringFor('phone')}
        />
      </Field>
      <Field label="Location">
        <div
          data-field="location"
          id="header-field-location"
          className={cn('rounded-2xl transition-shadow duration-700', ringFor('location'))}
        >
          <CityAutocomplete
            value={f.location}
            onChange={(next) => set('location', next)}
            placeholder="Start typing your city…"
          />
        </div>
      </Field>
      <Field label="LinkedIn">
        <Input
          ref={registerRef('linkedin')}
          id="header-field-linkedin"
          data-field="linkedin"
          placeholder="linkedin.com/in/your-handle"
          value={f.linkedin}
          onChange={(e) => set('linkedin', e.target.value)}
          className={ringFor('linkedin')}
        />
      </Field>
      <Field label="Website" className="sm:col-span-2">
        <Input
          ref={registerRef('website')}
          id="header-field-website"
          data-field="website"
          placeholder="your-portfolio.com"
          value={f.website}
          onChange={(e) => set('website', e.target.value)}
          className={ringFor('website')}
        />
      </Field>
    </div>
  );
}

function SummaryForm({ value, onChange }: CvEditorProps) {
  return (
    <textarea
      rows={6}
      maxLength={1500}
      value={value.summary}
      onChange={(e) => onChange({ ...value, summary: e.target.value })}
      placeholder="Customer-focused engineer with 5 years…"
      className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-[14px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent"
    />
  );
}

function ExperienceForm({
  value,
  onChange,
  cvId,
  focusItemId,
  focusBulletIndex,
}: CvEditorProps) {
  const setItem = (idx: number, patch: Partial<StructuredCvExperience>) => {
    const next = value.experience.map((e, i) => (i === idx ? { ...e, ...patch } : e));
    onChange({ ...value, experience: next });
  };
  const addItem = () =>
    onChange({
      ...value,
      experience: [
        ...value.experience,
        {
          id: `exp-${Date.now().toString(36)}`,
          title: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          current: false,
          achievements: [''],
        },
      ],
    });
  const removeItem = (idx: number) =>
    onChange({ ...value, experience: value.experience.filter((_, i) => i !== idx) });

  // Targeted rewrite drawer state. Only available when a cvId is threaded
  // through (i.e. the CV has been persisted; not on a brand-new draft).
  const [rewriteFor, setRewriteFor] = useState<{
    expId: string;
    bulletIdx: number;
    current: string;
  } | null>(null);

  // Item-level deep-link: when ?itemId=<exp-xxx> is in the URL we register a
  // ref per card and, after first paint, scroll & flash the matching card so
  // "Fix in builder" lands the user on the exact role the finding refers to.
  const cardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const [flashItemId, setFlashItemId] = useState<string | null>(null);
  useEffect(() => {
    if (!focusItemId) return;
    if (typeof window === 'undefined') return;
    // Defer to next frame so the card has actually mounted (especially when
    // the user just switched into the Experience tab from another section).
    const raf = window.requestAnimationFrame(() => {
      const el = cardRefs.current.get(focusItemId);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setFlashItemId(focusItemId);
    });
    const handle = window.setTimeout(() => setFlashItemId(null), 2200);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(handle);
    };
  }, [focusItemId, value.experience.length]);

  return (
    <div className="space-y-4">
      {value.experience.length === 0 ? (
        <p className="text-[13px] text-gray-500">No roles yet. Add your first below.</p>
      ) : null}
      {value.experience.map((exp, idx) => (
        <div
          key={exp.id}
          ref={(el) => {
            cardRefs.current.set(exp.id, el);
          }}
          data-item-id={exp.id}
          className={cn(
            'rounded-2xl transition-all duration-700',
            flashItemId === exp.id
              ? 'ring-2 ring-brand-green ring-offset-2 ring-offset-white'
              : '',
          )}
        >
          <ExperienceCard
            exp={exp}
            canRewrite={Boolean(cvId)}
            focusBulletIndex={focusItemId === exp.id ? focusBulletIndex ?? null : null}
            onChange={(patch) => setItem(idx, patch)}
            onRemove={() => removeItem(idx)}
            onRewriteBullet={(bulletIdx, current) =>
              setRewriteFor({ expId: exp.id, bulletIdx, current })
            }
          />
        </div>
      ))}
      <Button variant="ghost" type="button" onClick={addItem}>
        + Add role
      </Button>

      {rewriteFor && cvId ? (
        <RewriteDrawer
          target={{ cvId, expId: rewriteFor.expId, bulletIdx: rewriteFor.bulletIdx }}
          initialOriginal={rewriteFor.current}
          onClose={() => setRewriteFor(null)}
        />
      ) : null}
    </div>
  );
}

function ExperienceCard({
  exp,
  canRewrite,
  focusBulletIndex,
  onChange,
  onRemove,
  onRewriteBullet,
}: {
  exp: StructuredCvExperience;
  canRewrite: boolean;
  focusBulletIndex: number | null;
  onChange: (patch: Partial<StructuredCvExperience>) => void;
  onRemove: () => void;
  onRewriteBullet: (bulletIdx: number, current: string) => void;
}) {
  // Bullet-level deep-link: when this card is the focused role AND
  // focusBulletIndex points at a real bullet, scroll its textarea into view,
  // focus it, and ring-flash for 2.2s so the user lands on the exact line.
  const bulletRefs = useRef<Map<number, HTMLTextAreaElement | null>>(new Map());
  const [flashBulletIdx, setFlashBulletIdx] = useState<number | null>(null);
  useEffect(() => {
    if (focusBulletIndex === null || focusBulletIndex === undefined) return;
    if (typeof window === 'undefined') return;
    if (focusBulletIndex < 0 || focusBulletIndex >= exp.achievements.length) return;
    const raf = window.requestAnimationFrame(() => {
      const el = bulletRefs.current.get(focusBulletIndex);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
      setFlashBulletIdx(focusBulletIndex);
    });
    const handle = window.setTimeout(() => setFlashBulletIdx(null), 2200);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(handle);
    };
  }, [focusBulletIndex, exp.achievements.length]);
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Job title">
          <Input value={exp.title} onChange={(e) => onChange({ title: e.target.value })} />
        </Field>
        <Field label="Company">
          <Input value={exp.company} onChange={(e) => onChange({ company: e.target.value })} />
        </Field>
        <Field label="Location">
          <Input value={exp.location} onChange={(e) => onChange({ location: e.target.value })} />
        </Field>
        <Field label="Dates">
          <div className="flex gap-2">
            <Input
              placeholder="MM/YYYY"
              value={exp.startDate}
              onChange={(e) => onChange({ startDate: e.target.value })}
            />
            <Input
              placeholder={exp.current ? 'Present' : 'MM/YYYY'}
              disabled={exp.current}
              value={exp.endDate}
              onChange={(e) => onChange({ endDate: e.target.value })}
            />
          </div>
          <label className="mt-2 flex items-center gap-2 text-[12.5px] text-gray-600">
            <input
              type="checkbox"
              checked={exp.current}
              onChange={(e) => onChange({ current: e.target.checked, endDate: '' })}
              className="rounded border-gray-300"
            />
            I currently work here
          </label>
        </Field>
      </div>

      <Field label="Achievements">
        <div className="space-y-2">
          {exp.achievements.map((a, i) => (
            <div key={i} className="flex gap-2" data-bullet-idx={i}>
              <textarea
                id={`bullet-${exp.id}-${i}`}
                data-bullet-idx={i}
                ref={(el) => {
                  bulletRefs.current.set(i, el);
                }}
                rows={2}
                value={a}
                onChange={(e) => {
                  const next = exp.achievements.slice();
                  next[i] = e.target.value;
                  onChange({ achievements: next });
                }}
                placeholder="Increased monthly sales 10% by upselling and cross-selling…"
                className={cn(
                  'w-full rounded-2xl border border-gray-200 bg-white p-3 text-[13px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-shadow duration-700',
                  flashBulletIdx === i ? 'ring-2 ring-brand-green ring-offset-2 ring-offset-white' : '',
                )}
              />
              <div className="flex flex-col items-stretch gap-1">
                {canRewrite && a.trim().length >= 8 ? (
                  <button
                    type="button"
                    onClick={() => onRewriteBullet(i, a)}
                    className="inline-flex items-center gap-1 rounded-full border border-brand-green/30 bg-brand-green/5 px-2 py-1 text-[11px] font-semibold text-[#065f46] hover:bg-brand-green/10 whitespace-nowrap"
                    title="AI rewrite this bullet"
                  >
                    ✨ Rewrite
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    const next = exp.achievements.filter((_, idx) => idx !== i);
                    onChange({ achievements: next.length ? next : [''] });
                  }}
                  aria-label="Remove bullet"
                  className="text-gray-400 hover:text-red-500 px-2 text-lg"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          <Button
            variant="ghost"
            type="button"
            onClick={() => onChange({ achievements: [...exp.achievements, ''] })}
          >
            + Add bullet
          </Button>
        </div>
      </Field>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          className="text-[12px] text-gray-500 hover:text-red-600"
        >
          Remove role
        </button>
      </div>
    </div>
  );
}

function EducationForm({ value, onChange, focusItemId }: CvEditorProps) {
  const setItem = (idx: number, patch: Partial<StructuredCvEducation>) => {
    const next = value.education.map((e, i) => (i === idx ? { ...e, ...patch } : e));
    onChange({ ...value, education: next });
  };
  const addItem = () =>
    onChange({
      ...value,
      education: [
        ...value.education,
        {
          id: `edu-${Date.now().toString(36)}`,
          school: '',
          qualification: '',
          startDate: '',
          endDate: '',
          detail: '',
        },
      ],
    });
  const removeItem = (idx: number) =>
    onChange({ ...value, education: value.education.filter((_, i) => i !== idx) });

  // See ExperienceForm for the deep-link / scroll-and-flash pattern.
  const cardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const [flashItemId, setFlashItemId] = useState<string | null>(null);
  useEffect(() => {
    if (!focusItemId) return;
    if (typeof window === 'undefined') return;
    const raf = window.requestAnimationFrame(() => {
      const el = cardRefs.current.get(focusItemId);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setFlashItemId(focusItemId);
    });
    const handle = window.setTimeout(() => setFlashItemId(null), 2200);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(handle);
    };
  }, [focusItemId, value.education.length]);

  return (
    <div className="space-y-4">
      {value.education.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[13px] text-amber-900">
          <strong className="font-semibold">Tip:</strong> adding at least one education entry
          typically improves your match score by 8–12 points. You can still continue without one.
        </div>
      ) : null}
      {value.education.map((ed, idx) => (
        <div
          key={ed.id}
          ref={(el) => {
            cardRefs.current.set(ed.id, el);
          }}
          data-item-id={ed.id}
          className={cn(
            'rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3 transition-all duration-700',
            flashItemId === ed.id
              ? 'ring-2 ring-brand-green ring-offset-2 ring-offset-white border-brand-green/40'
              : '',
          )}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="School">
              <Input value={ed.school} onChange={(e) => setItem(idx, { school: e.target.value })} />
            </Field>
            <Field label="Qualification">
              <Input
                value={ed.qualification}
                onChange={(e) => setItem(idx, { qualification: e.target.value })}
              />
            </Field>
            <Field label="Start">
              <Input
                placeholder="YYYY"
                value={ed.startDate}
                onChange={(e) => setItem(idx, { startDate: e.target.value })}
              />
            </Field>
            <Field label="End">
              <Input
                placeholder="YYYY"
                value={ed.endDate}
                onChange={(e) => setItem(idx, { endDate: e.target.value })}
              />
            </Field>
            <Field label="Detail" className="sm:col-span-2">
              <Input
                placeholder="Honours, specialisation, GPA…"
                value={ed.detail}
                onChange={(e) => setItem(idx, { detail: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="text-[12px] text-gray-500 hover:text-red-600"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <Button variant="ghost" type="button" onClick={addItem}>
        + Add qualification
      </Button>
    </div>
  );
}

function SkillsForm({ value, onChange }: CvEditorProps) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const next = draft
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length);
    if (!next.length) return;
    const merged = Array.from(new Set([...value.skills, ...next]));
    onChange({ ...value, skills: merged.slice(0, 40) });
    setDraft('');
  };
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="React, TypeScript, Postgres"
        />
        <Button type="button" onClick={add}>
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {value.skills.map((s, i) => (
          <span
            key={`${s}-${i}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] text-[#065f46] text-[12.5px] font-medium px-3 py-1"
          >
            {s}
            <button
              type="button"
              onClick={() => onChange({ ...value, skills: value.skills.filter((_, idx) => idx !== i) })}
              className="text-[#065f46]/60 hover:text-[#065f46]"
              aria-label={`Remove ${s}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function statusLabel(s: SectionStatus): string {
  switch (s) {
    case 'empty':
      return 'not started';
    case 'partial':
      return 'in progress';
    case 'complete':
      return 'looking good';
  }
}

function statusDotClass(s: SectionStatus, isActive: boolean): string {
  if (s === 'complete') return isActive ? 'bg-white' : 'bg-emerald-500';
  if (s === 'partial') return isActive ? 'bg-white/60' : 'bg-amber-400';
  return isActive ? 'bg-white/30' : 'bg-gray-300';
}

function Field({
  label,
  children,
  className,
  required,
  optional,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <div className={className}>
      <Label className="mb-1 block text-[12.5px] font-medium text-gray-700">
        {label}
        {required ? (
          <span className="ml-1 text-red-500" aria-hidden="true">
            *
          </span>
        ) : null}
        {optional ? (
          <span className="ml-1 text-[11.5px] font-normal text-gray-400">(optional)</span>
        ) : null}
      </Label>
      {children}
    </div>
  );
}
