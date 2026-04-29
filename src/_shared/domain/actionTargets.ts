/**
 * Map an action-plan item (gap or suggestion) to the editor section the user
 * should jump to when they click "Fix in builder". Pure, deterministic — runs
 * on BE when populating the action plan and on FE when rendering deep links.
 *
 * Also extracts an optional quoted bullet from the action's `detail` text so
 * the FE can launch a targeted rewrite drawer (Phase D) instead of just
 * scrolling the editor.
 */

export type EditorSection = 'header' | 'summary' | 'experience' | 'education' | 'skills';

const SECTION_RULES: Array<{ section: EditorSection; pattern: RegExp }> = [
  // skills first because "skill" wins over "experience" mentions in keyword-gap suggestions
  { section: 'skills', pattern: /\b(skill|stack|tool|technolog|framework|keyword|programming language)/i },
  { section: 'summary', pattern: /\b(summary|profile|about|elevator|tagline|positioning|headline-style)/i },
  { section: 'header', pattern: /\b(contact|email|phone|linkedin|location|headline|title beneath your name)/i },
  { section: 'education', pattern: /\b(education|degree|university|qualification|gpa|honours|certification)/i },
  {
    section: 'experience',
    pattern:
      /\b(bullet|achievement|impact|quantif|metric|number|percentage|role|responsibilit|experience|leadership|action verb|outcome|result)/i,
  },
];

export function targetSectionForAction(input: {
  title: string;
  detail: string;
}): EditorSection {
  const haystack = `${input.title}\n${input.detail}`;
  for (const r of SECTION_RULES) {
    if (r.pattern.test(haystack)) return r.section;
  }
  return 'experience';
}

/**
 * If the action's detail contains a clearly-quoted bullet (double quotes,
 * smart quotes, or backticks), return its trimmed text. Used by FE to wire
 * a "Rewrite this bullet" CTA that opens the rewrite drawer pre-targeted.
 */
export function extractQuotedBullet(detail: string): string | null {
  if (!detail) return null;
  // Try double quotes first, then smart quotes, then backticks. Bullets must
  // be at least 8 chars so we don't pick up incidental keywords.
  const patterns = [/"([^"\n]{8,300})"/, /[\u201C\u201E]([^\u201D\u201F\n]{8,300})[\u201D\u201F]/, /`([^`\n]{8,300})`/];
  for (const p of patterns) {
    const m = detail.match(p);
    if (m && m[1]) return m[1].trim();
  }
  return null;
}
