const bullets = [
  'Evaluate your actual ability, not just your resume',
  'Improve continuously with feedback loops',
  'Combine AI with human insight',
  'Built around how hiring really works',
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

export default function Difference() {
  return (
    <section className="w-full bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Eyebrow + big headline */}
        <div className="text-center">
          <p className="text-base font-semibold text-[#22c55e]">How Artemis is different</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-[#9ca3af] sm:text-5xl lg:text-6xl">
            Not another job tool
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-[#6b7280] sm:text-lg">
            Other platforms help you organize your job search.
          </p>
        </div>

        {/* Two-column body */}
        <div className="mt-16 grid grid-cols-1 gap-10 lg:mt-20 lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* Left: heading + checklist */}
          <div>
            <h3 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-[#111827] sm:text-4xl lg:text-5xl">
              Artemis helps you become a stronger candidate
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

          {/* Right: 98% stat card */}
          <div className="rounded-3xl bg-[#f1f3f2] p-10 sm:p-14 lg:p-16">
            <div className="flex h-full flex-col justify-between gap-10 min-h-[320px]">
              <div className="text-[96px] font-bold leading-none tracking-tight text-[#9ca3af] sm:text-[140px] lg:text-[160px]">
                98%
              </div>
              <div>
                <p className="text-2xl font-bold text-[#111827] sm:text-3xl">
                  Users found Artemis helpful
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
