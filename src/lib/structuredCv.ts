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
