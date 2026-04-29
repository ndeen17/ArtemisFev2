/**
 * PRF-02 (companion) — Keyword gaps surfaced as chips. Distinct from `gaps[]` which
 * are coaching items; these are role-relevant skills/tools the CV doesn't mention.
 */
export function KeywordGapList({ keywords }: { keywords: string[] }) {
  if (keywords.length === 0) {
    return (
      <div className="text-[14px] text-gray-500">
        No keyword gaps detected — your CV covers the expected vocabulary.
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {keywords.map((k) => (
        <span
          key={k}
          className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 px-3 py-1 text-[12px] font-medium"
        >
          {k}
        </span>
      ))}
    </div>
  );
}
