import type {
  BuilderAction,
  StructuredCv,
  StructuredCvExperience,
  StructuredCvEducation,
  StructuredCvHeader,
} from '@artemis/shared';

/**
 * Pure reducer that applies a single CV builder action to a StructuredCv.
 *
 * Used by `CvBuilderPage` when the user clicks the "Apply" button on an
 * action card returned by `/cv/builder-chat`. We never mutate input — every
 * branch returns a new object so React/state diffing behaves predictably.
 *
 * If the action targets an experience/education entry that no longer exists
 * (id changed, index out of range), we no-op and return the CV unchanged.
 * The chat panel surfaces the dismissed action; the user can ask the bot
 * to re-emit a fresh suggestion.
 */
export function applyBuilderAction(cv: StructuredCv, action: BuilderAction): StructuredCv {
  switch (action.type) {
    case 'setHeader': {
      const header: StructuredCvHeader = { ...cv.header };
      const p = action.patch;
      if (p.fullName !== undefined) header.fullName = p.fullName;
      if (p.headline !== undefined) header.headline = p.headline;
      if (p.email !== undefined) header.email = p.email;
      if (p.phone !== undefined) header.phone = p.phone;
      if (p.location !== undefined) header.location = p.location;
      if (p.linkedin !== undefined) header.linkedin = p.linkedin;
      if (p.website !== undefined) header.website = p.website;
      return { ...cv, header };
    }
    case 'setSummary': {
      return { ...cv, summary: action.summary };
    }
    case 'addExperience': {
      const exp = makeExperience(action.experience);
      return { ...cv, experience: [...cv.experience, exp] };
    }
    case 'updateExperience': {
      const idx = resolveIndex(cv.experience, action.experienceId, action.experienceIndex);
      if (idx < 0) return cv;
      const next = cv.experience.slice();
      next[idx] = mergeExperience(next[idx]!, action.patch);
      return { ...cv, experience: next };
    }
    case 'addBullet': {
      const idx = resolveIndex(cv.experience, action.experienceId, action.experienceIndex);
      if (idx < 0) return cv;
      const target = cv.experience[idx]!;
      const bullet = action.bullet.trim();
      if (!bullet) return cv;
      const achievements = [...target.achievements, bullet];
      const next = cv.experience.slice();
      next[idx] = { ...target, achievements };
      return { ...cv, experience: next };
    }
    case 'addEducation': {
      const ed = makeEducation(action.education);
      return { ...cv, education: [...cv.education, ed] };
    }
    case 'updateEducation': {
      const idx = resolveIndex(cv.education, action.educationId, action.educationIndex);
      if (idx < 0) return cv;
      const next = cv.education.slice();
      next[idx] = mergeEducation(next[idx]!, action.patch);
      return { ...cv, education: next };
    }
    case 'addSkill': {
      return mergeSkills(cv, [action.skill]);
    }
    case 'addSkills': {
      return mergeSkills(cv, action.skills);
    }
    default: {
      // Exhaustiveness — narrow to never so any new action type forces a compile error.
      const _exhaustive: never = action;
      void _exhaustive;
      return cv;
    }
  }
}

// ----- helpers ---------------------------------------------------------------

function newId(prefix: string): string {
  const r =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${r}`;
}

function resolveIndex<T extends { id: string }>(
  list: T[],
  id: string | undefined,
  index: number | undefined,
): number {
  if (id) {
    const i = list.findIndex((x) => x.id === id);
    if (i >= 0) return i;
  }
  if (typeof index === 'number' && index >= 0 && index < list.length) return index;
  return -1;
}

function makeExperience(
  patch: NonNullable<Extract<BuilderAction, { type: 'addExperience' }>['experience']>,
): StructuredCvExperience {
  return {
    id: newId('exp'),
    title: patch.title ?? '',
    company: patch.company ?? '',
    location: patch.location ?? '',
    startDate: patch.startDate ?? '',
    endDate: patch.endDate ?? '',
    current: patch.current ?? false,
    achievements: (patch.achievements ?? []).filter((a) => a.trim().length > 0),
  };
}

function mergeExperience(
  target: StructuredCvExperience,
  patch: Extract<BuilderAction, { type: 'updateExperience' }>['patch'],
): StructuredCvExperience {
  return {
    ...target,
    title: patch.title ?? target.title,
    company: patch.company ?? target.company,
    location: patch.location ?? target.location,
    startDate: patch.startDate ?? target.startDate,
    endDate: patch.endDate ?? target.endDate,
    current: patch.current ?? target.current,
    achievements: patch.achievements
      ? patch.achievements.filter((a) => a.trim().length > 0)
      : target.achievements,
  };
}

function makeEducation(
  patch: NonNullable<Extract<BuilderAction, { type: 'addEducation' }>['education']>,
): StructuredCvEducation {
  return {
    id: newId('edu'),
    school: patch.school ?? '',
    qualification: patch.qualification ?? '',
    startDate: patch.startDate ?? '',
    endDate: patch.endDate ?? '',
    detail: patch.detail ?? '',
  };
}

function mergeEducation(
  target: StructuredCvEducation,
  patch: Extract<BuilderAction, { type: 'updateEducation' }>['patch'],
): StructuredCvEducation {
  return {
    ...target,
    school: patch.school ?? target.school,
    qualification: patch.qualification ?? target.qualification,
    startDate: patch.startDate ?? target.startDate,
    endDate: patch.endDate ?? target.endDate,
    detail: patch.detail ?? target.detail,
  };
}

function mergeSkills(cv: StructuredCv, additions: string[]): StructuredCv {
  const have = new Set(cv.skills.map((s) => s.toLowerCase().trim()));
  const next = cv.skills.slice();
  for (const raw of additions) {
    const s = raw.trim();
    if (!s) continue;
    const k = s.toLowerCase();
    if (have.has(k)) continue;
    have.add(k);
    next.push(s);
  }
  return { ...cv, skills: next };
}
