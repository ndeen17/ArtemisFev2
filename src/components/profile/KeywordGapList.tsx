/**
 * PRF-02 (companion) — Keyword gaps surfaced as chips. Distinct from `gaps[]` which
 * are coaching items; these are role-relevant skills/tools the CV doesn't mention.
 *
 * Phase 4 — accepts an optional `source` to label whether the gaps were
 * computed against a JD or against role priors.
 */
export function KeywordGapList({
  keywords,
  source = 'role',
  roleLabel,
}: {
  keywords: string[];
  source?: 'role' | 'jd';
  roleLabel?: string | null;
}) {
  const heading =
    source === 'jd'
      ? 'From this JD'
      : `Expected for ${roleLabel ?? 'your role'}`;
  if (keywords.length === 0) {
    return (
      <div className="text-[14px] text-gray-500">
        No keyword gaps detected — your CV covers the expected vocabulary.
      </div>
    );
  }
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
        {heading}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {keywords.map((k) => (
          <span
            key={k}
            className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 px-3 py-1 text-[12px] font-medium"
          >
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}
