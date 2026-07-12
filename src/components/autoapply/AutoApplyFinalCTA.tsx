/** AutoApply — green call-to-action banner near the bottom of the page. */
export function AutoApplyFinalCTA() {
  return (
    <section className="w-full bg-white px-6 py-20 lg:px-10 lg:py-24">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-[#22c55e] px-8 py-16 sm:px-12 sm:py-20 lg:px-16 lg:py-24">
        <img
          src="/assets/globe.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -bottom-10 hidden w-[520px] max-w-none opacity-90 select-none md:block lg:-right-10 lg:w-[620px]"
          draggable={false}
        />

        <div className="relative max-w-2xl">
          <h2 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
            Stop applying blindly.
            <br />
            Start auto-applying with Artemis.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            Most platforms leave the busywork to you. Artemis finds high-match roles and
            auto-applies on your behalf, so you spend less time filling forms and more time
            interviewing.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-[15px] font-semibold text-[#111827] shadow-[0_0_0_2px_rgba(255,255,255,0.35)] transition hover:bg-gray-50"
            >
              Start auto-applying
            </a>
            <a
              href="#autoapply"
              className="inline-flex items-center justify-center rounded-full bg-white/10 px-7 py-3 text-[15px] font-semibold text-white shadow-[0_0_0_2px_rgba(255,255,255,0.35)] backdrop-blur-sm transition hover:bg-white/20"
            >
              See how it works
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
