const columns = [
  {
    title: 'Platform',
    links: ['Reviews', 'Interviews', 'Mentors'],
  },
  {
    title: 'Company',
    links: ['About', 'Blog', 'Careers'],
  },
  {
    title: 'Legal',
    links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR Compliance'],
  },
];

/** Landing — site-wide footer with brand block and link columns. */
export function Footer() {
  return (
    <footer className="w-full bg-white px-6 pb-16 pt-12 lg:px-10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-4 md:gap-10">
        <div className="md:col-span-1">
          <div className="flex items-center gap-3">
            <img
              src="/assets/logomark.png"
              alt="Artemis"
              className="h-10 w-10 rounded-lg object-contain"
            />
            <span className="text-2xl font-bold tracking-tight text-[#111827]">Artemis</span>
          </div>
          <p className="mt-6 max-w-xs text-[15px] leading-relaxed text-[#9ca3af]">
            Land the job not just another application.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-[15px] font-medium text-[#9ca3af]">{col.title}</p>
            <ul className="mt-6 space-y-0">
              {col.links.map((label) => (
                <li key={label} className="border-b border-[#e5e7eb]">
                  <a
                    href="#"
                    className="block py-4 text-[17px] font-semibold text-[#111827] transition-colors hover:text-[#22c55e]"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
