import type { StructuredCv } from '@artemis/shared';

export function emptyStructuredCv(): StructuredCv {
  return {
    header: {
      fullName: '',
      headline: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      website: '',
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
  };
}

/**
 * A structured CV is "sparse" when its core surfaces are all empty. Used to
 * trigger an auto-reparse when an uploaded CV's structured shape never
 * populated (silent parse failure during upload).
 */
export function isStructuredCvSparse(cv: StructuredCv | null | undefined): boolean {
  if (!cv) return true;
  const noName = !(cv.header?.fullName ?? '').trim();
  const noExp = !cv.experience.some(
    (e) => (e.title ?? '').trim() || (e.company ?? '').trim() || e.achievements.some((a) => a.trim()),
  );
  const noSkills = cv.skills.length === 0;
  const noEdu = cv.education.length === 0;
  return noName && noExp && noSkills && noEdu;
}
