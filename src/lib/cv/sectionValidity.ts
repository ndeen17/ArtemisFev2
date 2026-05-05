import type { StructuredCv } from '@artemis/shared';

/**
 * Per-section completeness signal for the CV editor tab bar.
 *
 * - 'empty'    : nothing meaningful yet
 * - 'partial'  : some content but missing a hard requirement
 * - 'complete' : meets the minimum bar this section is expected to clear
 *
 * These are *advisory* — the dots help the user see where they still
 * have work to do. They are not gating: the user can navigate freely
 * between sections regardless.
 */
export type SectionStatus = 'empty' | 'partial' | 'complete';

export type CvSectionId = 'header' | 'summary' | 'experience' | 'education' | 'skills';

export function headerStatus(cv: StructuredCv): SectionStatus {
  const h = cv.header;
  const fullName = h.fullName.trim();
  const email = h.email.trim();
  const location = h.location.trim();
  const filled = [fullName, email, location].filter((v) => v.length > 0).length;
  if (filled === 0) return 'empty';
  // Need at least full name + one contact channel.
  if (fullName && (email || h.phone.trim() || h.linkedin.trim())) return 'complete';
  return 'partial';
}

export function summaryStatus(cv: StructuredCv): SectionStatus {
  const len = cv.summary.trim().length;
  if (len === 0) return 'empty';
  if (len < 80) return 'partial';
  return 'complete';
}

export function experienceStatus(cv: StructuredCv): SectionStatus {
  if (cv.experience.length === 0) return 'empty';
  const usable = cv.experience.filter((e) => {
    const hasMeta = e.title.trim().length > 0 && e.company.trim().length > 0;
    const hasBullet = e.achievements.some((a) => a.trim().length > 0);
    return hasMeta && hasBullet;
  });
  if (usable.length === 0) return 'partial';
  return 'complete';
}

export function educationStatus(cv: StructuredCv): SectionStatus {
  if (cv.education.length === 0) return 'empty';
  const usable = cv.education.filter((e) => e.school.trim().length > 0);
  if (usable.length === 0) return 'partial';
  return 'complete';
}

export function skillsStatus(cv: StructuredCv): SectionStatus {
  const n = cv.skills.filter((s) => s.trim().length > 0).length;
  if (n === 0) return 'empty';
  if (n < 5) return 'partial';
  return 'complete';
}

export function sectionStatus(id: CvSectionId, cv: StructuredCv): SectionStatus {
  switch (id) {
    case 'header':
      return headerStatus(cv);
    case 'summary':
      return summaryStatus(cv);
    case 'experience':
      return experienceStatus(cv);
    case 'education':
      return educationStatus(cv);
    case 'skills':
      return skillsStatus(cv);
  }
}
