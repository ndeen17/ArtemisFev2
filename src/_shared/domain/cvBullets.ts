/**
 * Helpers for locating and applying changes to a single bullet inside a
 * StructuredCv. Used by:
 *   - BE: bullet-rewrite Apply endpoint (mutates `experience[i].achievements[j]`).
 *   - FE: BulletFeedback / ActionPlan to discover whether a quoted bullet
 *     can be deep-linked into the rewrite drawer.
 *
 * Pure — never mutates the input. All comparisons are case-insensitive
 * trim-based exact matches; we deliberately avoid fuzzy matching so the
 * Apply flow never silently overwrites the wrong bullet.
 */

import type { StructuredCv, StructuredCvExperience } from '../schemas/cv.js';

export interface BulletPathLite {
  expId: string;
  bulletIdx: number;
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function findBulletInStructured(
  structured: StructuredCv | null | undefined,
  original: string,
): BulletPathLite | null {
  if (!structured || !original) return null;
  const target = norm(original);
  if (target.length < 4) return null;
  for (const exp of structured.experience) {
    for (let i = 0; i < exp.achievements.length; i++) {
      if (norm(exp.achievements[i] ?? '') === target) {
        return { expId: exp.id, bulletIdx: i };
      }
    }
  }
  return null;
}

export function getBulletAt(
  structured: StructuredCv,
  expId: string,
  bulletIdx: number,
): string | null {
  const exp = structured.experience.find((e) => e.id === expId);
  if (!exp) return null;
  if (bulletIdx < 0 || bulletIdx >= exp.achievements.length) return null;
  return exp.achievements[bulletIdx] ?? null;
}

/** Returns a NEW StructuredCv with the bullet at the given path replaced. */
export function applyBulletToStructured(
  structured: StructuredCv,
  expId: string,
  bulletIdx: number,
  text: string,
): StructuredCv {
  const experience: StructuredCvExperience[] = structured.experience.map((exp) => {
    if (exp.id !== expId) return exp;
    const achievements = exp.achievements.slice();
    if (bulletIdx < 0 || bulletIdx >= achievements.length) return exp;
    achievements[bulletIdx] = text.trim();
    return { ...exp, achievements };
  });
  return { ...structured, experience };
}
