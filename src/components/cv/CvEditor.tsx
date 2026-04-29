import { useState } from 'react';
import type {
  StructuredCv,
  StructuredCvExperience,
  StructuredCvEducation,
  CvCoachSection,
} from '@artemis/shared';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { CvPreview } from './CvPreview';
import { CvCoachChat } from './CvCoachChat';
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
}

export function CvEditor({ value, onChange }: CvEditorProps) {
  const [active, setActive] = useState<Section>('header');
  const [coachOpen, setCoachOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const activeMeta = SECTIONS.find((s) => s.id === active)!;

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
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setActive(s.id)}
                  aria-current={isActive ? 'step' : undefined}
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
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Body: two-pane on xl, single column below with toggleable preview */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)] gap-6">
        {/* Form column */}
        <section className="space-y-4 min-w-0">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[20px] font-semibold tracking-tight">
                  {sectionTitle(active)}
                </h3>
                <p className="mt-1 text-[13.5px] text-gray-500">{sectionHint(active)}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="xl:hidden shrink-0 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-gray-700 hover:bg-gray-50"
              >
                Preview
              </button>
            </div>
            <div className="mt-6">
              {active === 'header' ? <HeaderForm value={value} onChange={onChange} /> : null}
              {active === 'summary' ? <SummaryForm value={value} onChange={onChange} /> : null}
              {active === 'experience' ? (
                <ExperienceForm value={value} onChange={onChange} />
              ) : null}
              {active === 'education' ? (
                <EducationForm value={value} onChange={onChange} />
              ) : null}
              {active === 'skills' ? <SkillsForm value={value} onChange={onChange} /> : null}
            </div>
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

        {/* Preview column — always rendered on xl, off-canvas on smaller screens */}
        <aside className="hidden xl:block">
          <div className="sticky top-6 rounded-3xl border border-gray-100 bg-gray-50 p-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <CvPreview cv={value} />
          </div>
        </aside>
      </div>

      {/* Mobile/tablet preview drawer */}
      {previewOpen ? (
        <div className="xl:hidden fixed inset-0 z-40 flex">
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

function HeaderForm({ value, onChange }: CvEditorProps) {
  const set = <K extends keyof StructuredCv['header']>(k: K, v: StructuredCv['header'][K]) =>
    onChange({ ...value, header: { ...value.header, [k]: v } });
  const f = value.header;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label="Full name">
        <Input value={f.fullName} onChange={(e) => set('fullName', e.target.value)} />
      </Field>
      <Field label="Headline">
        <Input
          placeholder="Senior Frontend Engineer"
          value={f.headline}
          onChange={(e) => set('headline', e.target.value)}
        />
      </Field>
      <Field label="Email">
        <Input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} />
      </Field>
      <Field label="Phone">
        <Input value={f.phone} onChange={(e) => set('phone', e.target.value)} />
      </Field>
      <Field label="Location">
        <Input
          placeholder="Lagos, Nigeria"
          value={f.location}
          onChange={(e) => set('location', e.target.value)}
        />
      </Field>
      <Field label="LinkedIn">
        <Input
          placeholder="linkedin.com/in/your-handle"
          value={f.linkedin}
          onChange={(e) => set('linkedin', e.target.value)}
        />
      </Field>
      <Field label="Website" className="sm:col-span-2">
        <Input
          placeholder="your-portfolio.com"
          value={f.website}
          onChange={(e) => set('website', e.target.value)}
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

function ExperienceForm({ value, onChange }: CvEditorProps) {
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

  return (
    <div className="space-y-4">
      {value.experience.length === 0 ? (
        <p className="text-[13px] text-gray-500">No roles yet. Add your first below.</p>
      ) : null}
      {value.experience.map((exp, idx) => (
        <ExperienceCard
          key={exp.id}
          exp={exp}
          onChange={(patch) => setItem(idx, patch)}
          onRemove={() => removeItem(idx)}
        />
      ))}
      <Button variant="ghost" type="button" onClick={addItem}>
        + Add role
      </Button>
    </div>
  );
}

function ExperienceCard({
  exp,
  onChange,
  onRemove,
}: {
  exp: StructuredCvExperience;
  onChange: (patch: Partial<StructuredCvExperience>) => void;
  onRemove: () => void;
}) {
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
            <div key={i} className="flex gap-2">
              <textarea
                rows={2}
                value={a}
                onChange={(e) => {
                  const next = exp.achievements.slice();
                  next[i] = e.target.value;
                  onChange({ achievements: next });
                }}
                placeholder="Increased monthly sales 10% by upselling and cross-selling…"
                className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-[13px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => {
                  const next = exp.achievements.filter((_, idx) => idx !== i);
                  onChange({ achievements: next.length ? next : [''] });
                }}
                aria-label="Remove bullet"
                className="text-gray-400 hover:text-red-500 px-2"
              >
                ×
              </button>
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

function EducationForm({ value, onChange }: CvEditorProps) {
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

  return (
    <div className="space-y-4">
      {value.education.length === 0 ? (
        <p className="text-[13px] text-gray-500">No qualifications yet. Add your first below.</p>
      ) : null}
      {value.education.map((ed, idx) => (
        <div key={ed.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
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

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1 block text-[12.5px] font-medium text-gray-700">{label}</Label>
      {children}
    </div>
  );
}
