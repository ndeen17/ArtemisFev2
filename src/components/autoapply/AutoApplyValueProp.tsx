/** AutoApply — large value-proposition headline overlapping the hero band. */
export function AutoApplyValueProp() {
  return (
    <section className="relative w-full bg-[#ecedec] pt-28 sm:pt-32 pb-10">
      <div className="relative mx-auto max-w-[900px] px-6 text-center">
        <h2 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[64px]">
          <span className="text-[#111827]">One tool that finds, tailors, and applies</span>
          <br />
          <span className="text-[#9ca3af]">so you don&rsquo;t have to</span>
        </h2>

        <p className="mx-auto mt-8 max-w-[700px] text-base leading-relaxed text-[#6b7280] sm:text-lg">
          No more browsing job boards or filling out the same form twice. Artemis matches you to
          high-fit roles and submits tailored applications automatically.
        </p>
      </div>
    </section>
  );
}
