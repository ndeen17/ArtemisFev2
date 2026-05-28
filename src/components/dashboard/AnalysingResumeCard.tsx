import { SparklesIcon } from '@/components/ui/icons';

/**
 * Dashboard placeholder shown while the latest CV analysis is queued or
 * running. Replaces the misleading 50% readiness placeholder so users get
 * honest "we're working on it" feedback with motion that matches our brand.
 */
export function AnalysingResumeCard() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-card p-6 sm:p-8">
      {/* Soft animated gradient sweep — pure CSS, respects reduced motion. */}
      <div className="pointer-events-none absolute inset-0 motion-safe:animate-[shimmer_2.6s_ease-in-out_infinite] bg-[linear-gradient(110deg,transparent_30%,rgba(220,252,231,0.55)_50%,transparent_70%)] bg-[length:200%_100%]" />

      <div className="relative grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-6 sm:gap-8 items-center">
        {/* Animated logo / pulse */}
        <div className="flex items-center justify-center">
          <div className="relative w-[160px] h-[160px]">
            <span className="absolute inset-0 rounded-full bg-brand-greenSoft motion-safe:animate-ping opacity-75" />
            <span className="absolute inset-3 rounded-full bg-[#bbf7d0] motion-safe:animate-pulse" />
            <span className="absolute inset-6 rounded-full bg-white shadow-inner flex items-center justify-center">
              <SparklesIcon className="w-10 h-10 text-brand-green motion-safe:animate-pulse" />
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-green">
            Artemis is reading your CV
          </div>
          <h2 className="mt-1 text-[24px] font-extrabold tracking-tight text-ink leading-[1.15]">
            Analysing your resume…
          </h2>
          <p className="mt-2 text-[14px] text-ink-muted max-w-xl">
            We&apos;re scoring your CV bullet-by-bullet. This usually takes 10–30
            seconds and the page will update automatically.
          </p>

          <ul className="mt-5 space-y-2">
            <Step label="Parsing structure" delay="0ms" />
            <Step label="Extracting skills & roles" delay="500ms" />
            <Step label="Scoring strengths and gaps" delay="1000ms" />
          </ul>
        </div>
      </div>

      {/* Keyframes are scoped via a style tag so we don't have to touch Tailwind config. */}
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </section>
  );
}

function Step({ label, delay }: { label: string; delay: string }) {
  return (
    <li className="flex items-center gap-2.5 rounded-xl bg-surface-muted border border-gray-100 px-3 py-2">
      <span
        className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-brand-greenSoft motion-safe:animate-pulse"
        style={{ animationDelay: delay }}
        aria-hidden
      >
        <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
      </span>
      <span className="text-[13px] text-ink">{label}</span>
    </li>
  );
}
