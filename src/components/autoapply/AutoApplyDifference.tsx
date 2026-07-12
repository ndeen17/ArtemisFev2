const bullets = [
  'Matches you to roles you actually qualify for, not everything with a pulse',
  'Tailors your resume & cover letter for every application',
  'Submits applications automatically, no repetitive forms',
  'Coaches you live once the interviews start rolling in',
];

function CheckIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#22c55e"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden="true"
    >
      <polyline points="5 12 10 17 20 7" />
    </svg>
  );
}

/** AutoApply — differentiation section with bullet list and 98% stat card. */
export function AutoApplyDifference() {
  return (
    <section className="w-full bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="text-center">
          <p className="text-base font-semibold text-[#22c55e]">How Auto-Apply is different</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-[#9ca3af] sm:text-5xl lg:text-7xl">
            Not just another apply button
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-[#6b7280] sm:text-lg">
            Other tools blast the same resume everywhere and hope something sticks.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-10 lg:mt-20 lg:grid-cols-2 lg:gap-16 lg:items-center">
          <div>
            <h3 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-[#111827] sm:text-5xl lg:text-[56px]">
              Artemis applies smarter, not just faster
            </h3>

            <ul className="mt-10 space-y-6">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-4">
                  <CheckIcon />
                  <span className="text-base font-medium text-[#6b7280] sm:text-lg">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-[#f1f3f2] p-10 sm:p-14 lg:p-16">
            <div className="flex h-full flex-col justify-between gap-10 min-h-[320px]">
              <div className="text-[120px] font-bold leading-none tracking-tight text-[#9ca3af] sm:text-[160px] lg:text-[180px]">
                98%
              </div>
              <div>
                <p className="text-2xl font-bold text-[#111827] sm:text-3xl">
                  Users found Artemis&rsquo; auto-apply helpful
                </p>
                <p className="mt-2 text-base text-[#6b7280]">based on post-hire surveys</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
