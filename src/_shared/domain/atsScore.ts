import type {
  AtsScore,
  JdAnalysis,
  TitleAlignment,
} from '../schemas/application.js';
import type { StructuredCv } from '../schemas/cv.js';

/**
 * Phase 2 — ATS Simulation Score.
 *
 * Pure deterministic function over (CV, JdAnalysis). No LLM, no randomness.
 * Surfaced as an "estimate" — labelled as such in the UI.
 *
 * Weighting (sums to 100):
 *   keywordMatchRate      40
 *   contextualPlacement   20
 *   titleAlignment        15  (exact=15, semantic=10, mismatch=0)
 *   headerCompliance      15
 *   dateConsistency       10
 *   stuffing penalty       up to -10 (subtractive)
 */

const KEYWORD_WEIGHT = 40;
const CONTEXTUAL_WEIGHT = 20;
const TITLE_WEIGHT = 15;
const HEADER_WEIGHT = 15;
const DATE_WEIGHT = 10;
const STUFFING_PENALTY_PER_TERM = 2;
const STUFFING_PENALTY_CAP = 10;
const STUFFING_THRESHOLD = 4;

function normalise(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Word-boundary match keeps "react" from matching "reactor".
  const re = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'gi');
  return (haystack.match(re) ?? []).length;
}

function flattenStructuredCv(cv: StructuredCv): {
  fullText: string;
  experienceText: string;
  skillsText: string;
  latestTitle: string;
  dateTokens: string[];
  hasSummary: boolean;
  hasExperience: boolean;
  hasEducation: boolean;
  hasSkills: boolean;
} {
  const expBullets = (cv.experience ?? []).flatMap((e) =>
    e.achievements.filter((a) => a.trim().length > 0),
  );
  const expHeadings = (cv.experience ?? [])
    .map((e) => [e.title, e.company, e.location].filter(Boolean).join(' '))
    .join('\n');
  const experienceText = `${expHeadings}\n${expBullets.join('\n')}`;
  const skillsText = (cv.skills ?? []).join(' ');
  const eduText = (cv.education ?? [])
    .map((e) => [e.school, e.qualification, e.detail].filter(Boolean).join(' '))
    .join('\n');
  const fullText = [cv.summary ?? '', experienceText, skillsText, eduText]
    .filter(Boolean)
    .join('\n');
  const latestTitle = cv.experience?.[0]?.title ?? '';
  const dateTokens = (cv.experience ?? []).flatMap((e) =>
    [e.startDate, e.endDate].filter((d) => d.trim().length > 0),
  );
  return {
    fullText,
    experienceText,
    skillsText,
    latestTitle,
    dateTokens,
    hasSummary: (cv.summary ?? '').trim().length > 0,
    hasExperience: (cv.experience ?? []).length > 0,
    hasEducation: (cv.education ?? []).length > 0,
    hasSkills: (cv.skills ?? []).length > 0,
  };
}

function classifyDateFormat(token: string): string {
  const t = token.trim().toLowerCase();
  if (!t) return 'unknown';
  if (/^(present|current|now|ongoing)$/i.test(t)) return 'present';
  if (/^\d{1,2}\s*[\/\-.]\s*\d{4}$/.test(t)) return 'mmYYYY';
  if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z.]*\s+\d{4}$/i.test(t))
    return 'monthYYYY';
  if (/^\d{4}$/.test(t)) return 'YYYY';
  return 'unknown';
}

function dateConsistencyRatio(tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const counts: Record<string, number> = {};
  for (const t of tokens) {
    const f = classifyDateFormat(t);
    if (f === 'unknown' || f === 'present') continue;
    counts[f] = (counts[f] ?? 0) + 1;
  }
  let max = 0;
  let total = 0;
  for (const k of Object.keys(counts)) {
    max = Math.max(max, counts[k]);
    total += counts[k];
  }
  if (total === 0) return 0;
  return max / total;
}

function titleSimilarity(cvTitle: string, jdTitle: string): TitleAlignment {
  const a = normalise(cvTitle);
  const b = normalise(jdTitle);
  if (!a || !b) return 'mismatch';
  if (a === b) return 'exact';
  // Token overlap heuristic.
  const aTok = new Set(a.split(' ').filter((w) => w.length > 2));
  const bTok = new Set(b.split(' ').filter((w) => w.length > 2));
  let shared = 0;
  for (const t of aTok) if (bTok.has(t)) shared += 1;
  const denom = Math.min(aTok.size, bTok.size) || 1;
  if (shared / denom >= 0.5) return 'semantic';
  return 'mismatch';
}

/**
 * Compute the deterministic ATS-pass estimate for a tailored CV.
 */
export function computeAtsScore(cv: StructuredCv, jd: JdAnalysis): AtsScore {
  const flat = flattenStructuredCv(cv);
  const fullLower = flat.fullText.toLowerCase();
  const expLower = flat.experienceText.toLowerCase();

  // ---- keywordMatchRate ----
  const hard = jd.hardRequirements ?? [];
  const matched: string[] = [];
  const missing: string[] = [];
  for (const kw of hard) {
    if (countOccurrences(fullLower, kw.toLowerCase()) > 0) matched.push(kw);
    else missing.push(kw);
  }
  const keywordMatchRate = hard.length === 0 ? 1 : matched.length / hard.length;

  // ---- contextualPlacement ----
  // Of the matched keywords, how many appear inside experience bullets
  // (vs only in the skills list)? Rule B from the consultant note.
  let inContext = 0;
  for (const kw of matched) {
    if (countOccurrences(expLower, kw.toLowerCase()) > 0) inContext += 1;
  }
  const contextualPlacement = matched.length === 0 ? 0 : inContext / matched.length;

  // ---- titleAlignment ----
  const titleAlignment = titleSimilarity(flat.latestTitle, jd.jobTitle);

  // ---- headerCompliance ----
  // 4 standard sections: summary, experience, education, skills.
  const sectionsPresent =
    Number(flat.hasSummary) +
    Number(flat.hasExperience) +
    Number(flat.hasEducation) +
    Number(flat.hasSkills);
  const headerCompliance = sectionsPresent / 4;

  // ---- dateConsistency ----
  const dateConsistency = dateConsistencyRatio(flat.dateTokens);

  // ---- keywordStuffing ----
  // Rule D — flag any keyword from the JD top list (or hard requirements)
  // that appears more than 4 times across the full CV.
  const stuffCandidates = new Set<string>();
  for (const kf of jd.keywordFrequency ?? []) stuffCandidates.add(kf.term.toLowerCase());
  for (const kw of hard) stuffCandidates.add(kw.toLowerCase());
  const stuffed: string[] = [];
  for (const term of stuffCandidates) {
    if (countOccurrences(fullLower, term) > STUFFING_THRESHOLD) stuffed.push(term);
  }

  // ---- aggregate ----
  let overall =
    keywordMatchRate * KEYWORD_WEIGHT +
    contextualPlacement * CONTEXTUAL_WEIGHT +
    (titleAlignment === 'exact'
      ? TITLE_WEIGHT
      : titleAlignment === 'semantic'
      ? Math.round(TITLE_WEIGHT * (10 / 15))
      : 0) +
    headerCompliance * HEADER_WEIGHT +
    dateConsistency * DATE_WEIGHT;
  const stuffingPenalty = Math.min(STUFFING_PENALTY_CAP, stuffed.length * STUFFING_PENALTY_PER_TERM);
  overall = Math.max(0, Math.min(100, Math.round(overall - stuffingPenalty)));

  // Surface up to 8 most-frequent missing keywords first (sorted by JD frequency).
  const freqMap = new Map<string, number>();
  for (const kf of jd.keywordFrequency ?? []) freqMap.set(kf.term.toLowerCase(), kf.count);
  const missingSorted = [...missing].sort(
    (a, b) => (freqMap.get(b.toLowerCase()) ?? 0) - (freqMap.get(a.toLowerCase()) ?? 0),
  );

  return {
    overall,
    keywordMatchRate: Math.round(keywordMatchRate * 1000) / 1000,
    titleAlignment,
    headerCompliance: Math.round(headerCompliance * 1000) / 1000,
    dateConsistency: Math.round(dateConsistency * 1000) / 1000,
    contextualPlacement: Math.round(contextualPlacement * 1000) / 1000,
    keywordStuffing: stuffed.slice(0, 20),
    missingTopKeywords: missingSorted.slice(0, 8),
    computedAt: new Date().toISOString(),
  };
}

/**
 * Cover-letter variant. Letters aren't ATS-parsed the same way, so we collapse
 * to a keyword-coverage signal and skip headers/dates. Title alignment is
 * checked against the letter's own first paragraph if a match is plausible.
 */
export function computeCoverLetterAtsScore(text: string, jd: JdAnalysis): AtsScore {
  const lower = text.toLowerCase();
  const hard = jd.hardRequirements ?? [];
  const matched: string[] = [];
  const missing: string[] = [];
  for (const kw of hard) {
    if (countOccurrences(lower, kw.toLowerCase()) > 0) matched.push(kw);
    else missing.push(kw);
  }
  const keywordMatchRate = hard.length === 0 ? 1 : matched.length / hard.length;

  // Stuffing is rarer in letters; threshold relaxed to 5+.
  const stuffCandidates = new Set<string>();
  for (const kf of jd.keywordFrequency ?? []) stuffCandidates.add(kf.term.toLowerCase());
  for (const kw of hard) stuffCandidates.add(kw.toLowerCase());
  const stuffed: string[] = [];
  for (const term of stuffCandidates) {
    if (countOccurrences(lower, term) > 5) stuffed.push(term);
  }

  // Cover letter title alignment is checked against the JD title appearing in the letter at all.
  const titleAlignment: TitleAlignment = jd.jobTitle && lower.includes(jd.jobTitle.toLowerCase())
    ? 'exact'
    : 'mismatch';

  // Score: 70% from keyword match, 20% from title-mention, 10% baseline. Stuffing penalty.
  let overall =
    keywordMatchRate * 70 +
    (titleAlignment === 'exact' ? 20 : 0) +
    10;
  overall = Math.max(0, Math.min(100, Math.round(overall - Math.min(10, stuffed.length * 2))));

  const freqMap = new Map<string, number>();
  for (const kf of jd.keywordFrequency ?? []) freqMap.set(kf.term.toLowerCase(), kf.count);
  const missingSorted = [...missing].sort(
    (a, b) => (freqMap.get(b.toLowerCase()) ?? 0) - (freqMap.get(a.toLowerCase()) ?? 0),
  );

  return {
    overall,
    keywordMatchRate: Math.round(keywordMatchRate * 1000) / 1000,
    titleAlignment,
    headerCompliance: 1, // not meaningful for letters
    dateConsistency: 1, // not meaningful for letters
    contextualPlacement: keywordMatchRate, // letters embed by nature
    keywordStuffing: stuffed.slice(0, 20),
    missingTopKeywords: missingSorted.slice(0, 8),
    computedAt: new Date().toISOString(),
  };
}

/**
 * UI helper — categorise the score into a band for colour/label.
 * Thresholds match the consultant proposal: <60 red, 60–80 amber, >80 green.
 */
export type AtsBand = 'red' | 'amber' | 'green';
export function atsBand(score: number): AtsBand {
  if (score >= 80) return 'green';
  if (score >= 60) return 'amber';
  return 'red';
}
