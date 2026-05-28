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
 * Returns true when an action plan item is purely about CV structure,
 * formatting, layout, length, font, spacing, section ordering, or visual
 * design. The builder already enforces a clean, ATS-safe structure, so these
 * findings are filtered out of the action plan before the user sees them.
 *
 * Conservative on purpose: content findings that merely mention "bullet" or
 * "section" in a substantive way (e.g. "add quantified bullets") are NOT
 * matched here — only items whose primary subject is formatting/structure.
 */
const FORMATTING_PATTERNS: ReadonlyArray<RegExp> = [
  /\b(formatting|layout|font|typeface|spacing|margins?|columns?|alignment|whitespace|white\s+space|readability|aesthetic|visual\s+design|template)\b/i,
  /\b(one[\s-]page|two[\s-]page|page\s+length|cv\s+length|resume\s+length|too\s+long|too\s+short|trim\s+(?:the\s+)?(?:cv|resume))\b/i,
  /\b(section\s+(?:order|heading|header|title)|reorder\s+sections?|organi[sz]e\s+sections?|structure\s+of\s+(?:your|the)\s+(?:cv|resume|document))\b/i,
  /\bATS[\s-]?(?:friendly\s+)?(?:format|layout|template|structure|parsing)\b/i,
  /\bconsistent\s+(?:formatting|format|style|styling|font|punctuation|capitali[sz]ation|tense|date\s+format)\b/i,
  /\b(punctuation|capitali[sz]ation)\s+(?:consistency|consistent|errors?|issues?)\b/i,
  /\bbullet\s+(?:style|formatting|format|alignment|symbol)\b/i,
];

export function isStructureOrFormattingAction(input: {
  title: string;
  detail: string;
}): boolean {
  const haystack = `${input.title}\n${input.detail}`;
  return FORMATTING_PATTERNS.some((p) => p.test(haystack));
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

/**
 * Minimal structural shape of a CV needed by `matchActionToCvItem`. Lets this
 * module stay zero-dependency (no schema imports) so the BE and FE copies are
 * byte-identical.
 */
export interface ActionTargetCvShape {
  experience: ReadonlyArray<{
    id: string;
    title?: string;
    company?: string;
    startDate?: string;
    endDate?: string;
    achievements?: ReadonlyArray<string>;
  }>;
  education: ReadonlyArray<{
    id: string;
    school?: string;
    qualification?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

const NORM_WS = /\s+/g;
function norm(s: string | undefined | null): string {
  return (s ?? '').toLowerCase().replace(NORM_WS, ' ').trim();
}
/** Words we never use as a match signal because they'd produce false positives. */
const STOPWORDS = new Set([
  'inc', 'ltd', 'llc', 'co', 'corp', 'company', 'group', 'the', 'and', 'of',
  'university', 'college', 'school', 'institute',
]);
function isMeaningful(token: string): boolean {
  return token.length >= 3 && !STOPWORDS.has(token);
}

/**
 * Heuristically match an action-plan item to a specific Experience or Education
 * entry in the user's structured CV. Returns the matched item id, or null when
 * the action either targets a non-item section (summary/skills/header) or no
 * confident match exists. "Confident" means a unique highest-scoring item with
 * score >= 1 — ties resolve to null so we never guess.
 *
 * Pure & deterministic; safe to run on BE (when building the action plan) and
 * FE (for backfilling legacy items missing `itemId`).
 */
export function matchActionToCvItem(input: {
  title: string;
  detail: string;
  quotedBullet?: string | null;
  section: EditorSection;
  cv: ActionTargetCvShape | null | undefined;
}): string | null {
  if (!input.cv) return null;
  if (input.section !== 'experience' && input.section !== 'education') return null;

  const haystack = norm(`${input.title}\n${input.detail}`);
  const quoted = norm(input.quotedBullet ?? extractQuotedBullet(input.detail) ?? '');

  if (input.section === 'experience') {
    const scores = input.cv.experience.map((item) => {
      let score = 0;
      const company = norm(item.company);
      const title = norm(item.title);
      if (company && isMeaningful(company) && haystack.includes(company)) score += 3;
      if (title && isMeaningful(title) && haystack.includes(title)) score += 2;
      // Date co-occurrence is a weak signal on its own — only contributes when
      // we already have a name/title hit, to avoid 2023 == 2023 false positives.
      const start = norm(item.startDate);
      const end = norm(item.endDate);
      if (score > 0) {
        if (start && start.length >= 4 && haystack.includes(start)) score += 1;
        if (end && end.length >= 4 && haystack.includes(end)) score += 1;
      }
      // Quoted-bullet substring inside one of this item's achievements is a
      // strong signal on its own.
      if (quoted && item.achievements) {
        for (const a of item.achievements) {
          const na = norm(a);
          if (na && (na.includes(quoted) || quoted.includes(na))) {
            score += 4;
            break;
          }
        }
      }
      return { id: item.id, score };
    });
    return pickUniqueWinner(scores);
  }

  // education
  const scores = input.cv.education.map((item) => {
    let score = 0;
    const school = norm(item.school);
    const qual = norm(item.qualification);
    if (school && isMeaningful(school) && haystack.includes(school)) score += 3;
    if (qual && isMeaningful(qual) && haystack.includes(qual)) score += 2;
    if (score > 0) {
      const start = norm(item.startDate);
      const end = norm(item.endDate);
      if (start && start.length >= 4 && haystack.includes(start)) score += 1;
      if (end && end.length >= 4 && haystack.includes(end)) score += 1;
    }
    return { id: item.id, score };
  });
  return pickUniqueWinner(scores);
}

function pickUniqueWinner(scores: ReadonlyArray<{ id: string; score: number }>): string | null {
  let best: { id: string; score: number } | null = null;
  let tie = false;
  for (const s of scores) {
    if (s.score <= 0) continue;
    if (!best || s.score > best.score) {
      best = s;
      tie = false;
    } else if (s.score === best.score) {
      tie = true;
    }
  }
  if (!best || tie) return null;
  return best.id;
}

/**
 * Find which achievement bullet inside an experience entry matches a quoted
 * bullet string. Returns the 0-based index or null when there's no confident
 * match. Used by the action-plan builder to backfill `bulletIndex` when the
 * LLM gave us a `quotedBullet` but didn't anchor it to a numeric index, and
 * by the FE for the same backfill on legacy actions.
 *
 * Matching strategy (most specific first):
 *   1. Exact normalised equality.
 *   2. Achievement contains the quoted text (LLM may have truncated).
 *   3. Quoted text contains the achievement (LLM may have quoted a longer
 *      composite — rare but happens with paraphrased bullets).
 *
 * Ties / multiple matches → null (we never guess). Empty quote → null.
 */
export function findBulletIndexInItem(
  achievements: ReadonlyArray<string> | undefined,
  quotedBullet: string | null | undefined,
): number | null {
  if (!quotedBullet || !achievements?.length) return null;
  const target = norm(quotedBullet);
  if (target.length < 8) return null; // too short to be discriminating

  // 1. Exact equality wins outright.
  let exact: number | null = null;
  for (let i = 0; i < achievements.length; i++) {
    if (norm(achievements[i]) === target) {
      if (exact !== null) return null; // duplicate bullets — ambiguous
      exact = i;
    }
  }
  if (exact !== null) return exact;

  // 2 / 3. Substring containment, either direction. Require a unique winner.
  let containmentHit: number | null = null;
  for (let i = 0; i < achievements.length; i++) {
    const a = norm(achievements[i]);
    if (!a) continue;
    if (a.includes(target) || target.includes(a)) {
      if (containmentHit !== null) return null; // ambiguous
      containmentHit = i;
    }
  }
  return containmentHit;
}

/**
 * Cross-role version of `findBulletIndexInItem`. Scans every role's bullets
 * looking for a UNIQUE match for the quoted text and returns both the role id
 * and bullet index when exactly one role has exactly one match. Lets the
 * action-plan resolver rescue findings where the LLM emitted a verbatim quote
 * but forgot (or hallucinated) the expId — instead of dropping the precision,
 * we backfill it from the text. Returns null on ambiguity / no match so we
 * never guess.
 */
export function findBulletAcrossRoles(
  cv: ActionTargetCvShape | null | undefined,
  quotedBullet: string | null | undefined,
): { itemId: string; bulletIndex: number } | null {
  if (!cv || !quotedBullet) return null;
  const target = norm(quotedBullet);
  if (target.length < 8) return null;
  let hit: { itemId: string; bulletIndex: number } | null = null;
  for (const role of cv.experience) {
    const idx = findBulletIndexInItem(role.achievements, quotedBullet);
    if (idx === null) continue;
    if (hit) return null; // matched in two roles — ambiguous
    hit = { itemId: role.id, bulletIndex: idx };
  }
  return hit;
}

/**
 * Detect "collection-level" language that violates the analysis prompt's
 * SPECIFICITY CONTRACT — phrases like "some of your roles", "one of your
 * experiences", "across your bullets". When an LLM-emitted gap or suggestion
 * concerns Experience or Education but anchors to no specific id AND the text
 * reads like a collection-level finding, we drop it entirely (rather than
 * surface a vague CTA that lands the user on a section with nothing flashing).
 *
 * Pure regex — runs on both BE (when building the action plan) and FE (so a
 * future client-side filter or test can apply the same rule).
 */
const VAGUE_COLLECTION_PATTERNS: ReadonlyArray<RegExp> = [
  /\b(?:some|one|a\s+few|several|many|most|various|multiple|certain|a\s+couple)\s+of\s+(?:your|the)\s+(?:roles?|positions?|jobs?|experiences?|entries|bullets?|achievements?|points?|qualifications?)\b/i,
  /\b(?:across|throughout|in|within)\s+(?:your|the)\s+(?:experience(?:\s+section)?|roles?|positions?|bullets?|achievements?|cv|resume)\b/i,
  /\byour\s+(?:roles?|positions?|jobs?|experiences?|bullets?|achievements?|entries)\s+(?:in\s+general|generally|overall|tend\s+to|often|typically)\b/i,
  /\b(?:each|every|all)\s+(?:of\s+your\s+)?(?:roles?|positions?|jobs?|experiences?|bullets?|achievements?)\b/i,
  /\bmany\s+bullets?\b/i,
];

export function isVagueCollectionLanguage(text: string): boolean {
  if (!text) return false;
  return VAGUE_COLLECTION_PATTERNS.some((p) => p.test(text));
}

/**
 * Returns true when the given text names at least one role (company OR title)
 * or education entry (school OR qualification) from the user's CV. Used by the
 * action-plan filter as the "earned exception": a finding may survive without
 * a resolved id if it at least names a specific entity by hand — that means
 * the LLM was being specific even if the id rescue failed, and the user can
 * recognise where it points.
 */
export function mentionsSpecificEntity(
  text: string,
  cv: ActionTargetCvShape | null | undefined,
): boolean {
  if (!text || !cv) return false;
  const hay = norm(text);
  if (!hay) return false;
  const tokens: string[] = [];
  for (const e of cv.experience) {
    if (e.company) tokens.push(norm(e.company));
    if (e.title) tokens.push(norm(e.title));
  }
  for (const ed of cv.education) {
    if (ed.school) tokens.push(norm(ed.school));
    if (ed.qualification) tokens.push(norm(ed.qualification));
  }
  return tokens.some((t) => t && isMeaningful(t) && hay.includes(t));
}
