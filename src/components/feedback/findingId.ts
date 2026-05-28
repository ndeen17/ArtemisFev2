/**
 * Build a stable, deterministic findingId from a free-text title.
 *
 * Findings (gaps / suggestions / strengths) come out of the LLM as an
 * unordered array with no explicit id. To get aggregate signal across users
 * and re-analyses, we want the same wording to map to the same id — array
 * index is too brittle (a re-analysis can reorder), but the title is what
 * the LLM is anchored on and is stable across renders of the same result.
 *
 * The slug is bounded to 64 chars to leave headroom under the BE's
 * `findingId.max(128)` constraint while staying well-formed.
 */
export function findingIdFromTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return slug.length > 0 ? slug : 'untitled';
}
