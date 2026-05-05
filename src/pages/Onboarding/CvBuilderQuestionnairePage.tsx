import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { QuestionnaireAnswersSchema, type QuestionnaireAnswers } from '@artemis/shared';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { StepHeader } from '@/components/onboarding/StepHeader';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { PlusIcon, SpinnerIcon, TrashIcon } from '@/components/ui/icons';
import { usePatchOnboarding } from '@/hooks/useOnboarding';
import { extractApiError } from '@/hooks/useAuth';
import { useCvBuilderDraftStore } from '@/store/cvBuilderDraftStore';

/**
 * Step 1 of the merged onboarding CV builder. Captures the user's basics
 * (name, headline, summary, experience, education, skills) and stashes
 * them in `cvBuilderDraftStore` before handing off to the optional JD
 * step at /onboarding/cv/jd. No AI call here — generation only happens
 * once the user clicks Continue on the JD step (with or without a JD).
 *
 * Required-to-continue: fullName + at least one experience row with
 * both title and company filled. All other sections are optional.
 */
export default function CvBuilderQuestionnairePage() {
  const navigate = useNavigate();
  const patch = usePatchOnboarding();
  const draftAnswers = useCvBuilderDraftStore((s) => s.answers);
  const setAnswers = useCvBuilderDraftStore((s) => s.setAnswers);
  const [topError, setTopError] = useState<string | null>(null);
  const [skillsInput, setSkillsInput] = useState('');

  const form = useForm<QuestionnaireAnswers>({
    resolver: zodResolver(QuestionnaireAnswersSchema),
    defaultValues: draftAnswers ?? {
      fullName: '',
      headline: '',
      summary: '',
      experience: [{ title: '', company: '', startDate: '', endDate: '', achievements: [] }],
      education: [],
      skills: [],
    },
    mode: 'onSubmit',
  });

  const expArray = useFieldArray({ control: form.control, name: 'experience' });
  const eduArray = useFieldArray({ control: form.control, name: 'education' });
  const skills = form.watch('skills');
  const summary = form.watch('summary') ?? '';
  const headline = form.watch('headline') ?? '';
  const watchedExperience = form.watch('experience');

  /**
   * Soft signal-counter — informational only, never blocks the submit.
   *
   * The AI prompts cope reasonably with sparse input but the resulting CV
   * reads thin. If the user's giving us almost nothing to go on, surface a
   * gentle nudge so they fill in the obvious gaps before we burn an AI
   * call. Threshold is deliberately forgiving: a couple of meaningful
   * fields are enough to avoid the warning.
   */
  const filledRoles = (watchedExperience ?? []).filter(
    (e) => e.title?.trim() && e.company?.trim(),
  ).length;
  const summaryChars = summary.trim().length;
  const headlineChars = headline.trim().length;
  const signalScore =
    (summaryChars >= 80 ? 2 : summaryChars >= 30 ? 1 : 0) +
    (headlineChars >= 10 ? 1 : 0) +
    (filledRoles >= 2 ? 2 : filledRoles >= 1 ? 1 : 0) +
    (skills.length >= 5 ? 2 : skills.length >= 2 ? 1 : 0);
  const lowSignal = signalScore < 3;

  function addSkill() {
    const v = skillsInput.trim();
    if (!v) return;
    if (!skills.includes(v)) form.setValue('skills', [...skills, v]);
    setSkillsInput('');
  }

  function removeSkill(i: number) {
    form.setValue(
      'skills',
      skills.filter((_, idx) => idx !== i),
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setTopError(null);
    // Strip empty rows the user added but never filled out, and require at
    // least one experience row with both title + company before continuing.
    const cleaned: QuestionnaireAnswers = {
      ...values,
      experience: values.experience.filter((e) => e.title.trim() && e.company.trim()),
      education: values.education.filter((e) => e.school.trim()),
    };
    if (cleaned.experience.length === 0) {
      setTopError('Add at least one role with a title and company so we have something to work with.');
      return;
    }
    try {
      setAnswers(cleaned);
      await patch.mutateAsync({ onboardingStep: 'cv_builder_jd' });
      navigate('/onboarding/cv/jd');
    } catch (err) {
      setTopError(extractApiError(err).message);
    }
  });

  return (
    <OnboardingLayout step={3} backTo="/onboarding/cv">
      <StepHeader
        eyebrow="Step 3 · Basics"
        title="Tell us about yourself."
        subtitle="We'll turn this into a clean starter CV. Next, you can optionally tailor it to a specific job description — or just skip ahead."
      />

      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            id="q-fullname"
            label="Full name"
            placeholder="Jane Doe"
            error={form.formState.errors.fullName?.message}
            {...form.register('fullName')}
          />
          <FormField
            id="q-headline"
            label="Headline (optional)"
            placeholder="Senior Software Engineer"
            error={form.formState.errors.headline?.message}
            {...form.register('headline')}
          />
        </div>

        <div>
          <label
            htmlFor="q-summary"
            className="block text-[14px] font-semibold text-[#111827] mb-1.5"
          >
            Short summary (optional)
          </label>
          <textarea
            id="q-summary"
            rows={3}
            maxLength={1000}
            placeholder="Two or three sentences about what you're great at."
            className="w-full resize-none rounded-2xl border border-gray-200 bg-white p-4 text-[15px] text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-[#dcfce7]"
            {...form.register('summary')}
          />
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-[#111827]">Experience</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                expArray.append({
                  title: '',
                  company: '',
                  startDate: '',
                  endDate: '',
                  achievements: [],
                })
              }
            >
              <span className="inline-flex items-center gap-1.5">
                <PlusIcon /> Add role
              </span>
            </Button>
          </div>
          {expArray.fields.map((field, idx) => (
            <div
              key={field.id}
              className="rounded-2xl border border-gray-200 bg-[#fafafa] p-4 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  id={`exp-title-${idx}`}
                  label="Title"
                  placeholder="Senior Engineer"
                  error={form.formState.errors.experience?.[idx]?.title?.message}
                  {...form.register(`experience.${idx}.title` as const)}
                />
                <FormField
                  id={`exp-company-${idx}`}
                  label="Company"
                  placeholder="Acme Corp"
                  error={form.formState.errors.experience?.[idx]?.company?.message}
                  {...form.register(`experience.${idx}.company` as const)}
                />
                <FormField
                  id={`exp-start-${idx}`}
                  label="Start (e.g. 2021)"
                  placeholder="2021"
                  {...form.register(`experience.${idx}.startDate` as const)}
                />
                <FormField
                  id={`exp-end-${idx}`}
                  label="End (or 'Present')"
                  placeholder="Present"
                  {...form.register(`experience.${idx}.endDate` as const)}
                />
              </div>
              {expArray.fields.length > 1 ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => expArray.remove(idx)}
                    className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-red-600"
                  >
                    <TrashIcon /> Remove
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-[#111827]">Education (optional)</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => eduArray.append({ school: '', qualification: '', year: '' })}
            >
              <span className="inline-flex items-center gap-1.5">
                <PlusIcon /> Add
              </span>
            </Button>
          </div>
          {eduArray.fields.map((field, idx) => (
            <div
              key={field.id}
              className="rounded-2xl border border-gray-200 bg-[#fafafa] p-4 grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <FormField
                id={`edu-school-${idx}`}
                label="School"
                placeholder="University of Somewhere"
                error={form.formState.errors.education?.[idx]?.school?.message}
                {...form.register(`education.${idx}.school` as const)}
              />
              <FormField
                id={`edu-q-${idx}`}
                label="Qualification"
                placeholder="BSc Computer Science"
                {...form.register(`education.${idx}.qualification` as const)}
              />
              <FormField
                id={`edu-year-${idx}`}
                label="Year"
                placeholder="2018"
                {...form.register(`education.${idx}.year` as const)}
              />
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-[16px] font-semibold text-[#111827]">Skills</h2>
          <div className="flex gap-2">
            <input
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="Type a skill and press Enter"
              className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-[14px] text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-[#dcfce7]"
            />
            <Button type="button" variant="outline" size="sm" onClick={addSkill}>
              Add
            </Button>
          </div>
          {skills.length ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((s, i) => (
                <span
                  key={`${s}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] text-[#065f46] text-[13px] font-medium px-3 py-1"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSkill(i)}
                    className="text-[#065f46]/60 hover:text-[#065f46]"
                    aria-label={`Remove ${s}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </section>

        {topError ? <div className="text-[13px] text-red-600">{topError}</div> : null}

        {lowSignal ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13.5px] text-amber-900 leading-relaxed">
            <span className="font-semibold">We can still build something, but it'll be light.</span>{' '}
            A short summary, a headline and a couple of skills give the AI a lot more to work with.
            You can continue anyway and refine in the editor.
          </div>
        ) : null}

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={patch.isPending}>
            {patch.isPending ? (
              <span className="inline-flex items-center gap-2">
                <SpinnerIcon /> Saving…
              </span>
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </form>
    </OnboardingLayout>
  );
}
