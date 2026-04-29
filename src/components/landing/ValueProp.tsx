/** Landing — large value-proposition headline overlapping the hero band. */
export function ValueProp() {
  return (
    <section className="relative w-full bg-[#ecedec] pt-28 sm:pt-32 pb-10 -mt-40 sm:-mt-56 lg:-mt-80">
      <div className="relative mx-auto max-w-[900px] px-6 text-center">
        <h2 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[64px]">
          <span className="text-[#111827]">Everything you need to get hired</span>
          <br />
          <span className="text-[#9ca3af]">in one place</span>
        </h2>

        <p className="mx-auto mt-8 max-w-[700px] text-base leading-relaxed text-[#6b7280] sm:text-lg">
          Stop jumping between tools. Artemis guides you from application to offer with a clear,
          structured path.
        </p>
      </div>
    </section>
  );
}
