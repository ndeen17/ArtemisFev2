import type { StructuredCv } from '@artemis/shared';

/**
 * CvPreview — single-column ATS-friendly live preview matching the PDF output.
 * Rendered into a fixed-width "page" inside a scroll container so the right pane
 * shows a believable approximation of the downloadable result.
 */
export function CvPreview({ cv }: { cv: StructuredCv }) {
  const contact = [
    cv.header.email,
    cv.header.phone,
    cv.header.location,
    cv.header.linkedin,
    cv.header.website,
  ].filter((s) => s && s.trim());

  return (
    <div className="bg-white shadow-[0_2px_24px_rgba(0,0,0,0.06)] mx-auto w-full max-w-[640px] min-h-[860px] p-10 text-[#111827]">
      {cv.header.fullName ? (
        <h1 className="text-[26px] font-extrabold tracking-tight">{cv.header.fullName}</h1>
      ) : (
        <Placeholder text="Your name" big />
      )}
      {cv.header.headline ? (
        <p className="mt-1 text-[14px] text-gray-500">{cv.header.headline}</p>
      ) : null}
      {contact.length ? (
        <p className="mt-1 text-[12px] text-gray-500">{contact.join('  •  ')}</p>
      ) : null}

      {cv.summary?.trim() ? (
        <Section label="Summary">
          <p className="text-[13px] leading-relaxed text-[#111827] whitespace-pre-wrap">
            {cv.summary}
          </p>
        </Section>
      ) : null}

      {cv.experience.length ? (
        <Section label="Experience">
          <div className="space-y-4">
            {cv.experience.map((e) => {
              const dates = [e.startDate, e.current ? 'Present' : e.endDate]
                .filter(Boolean)
                .join(' – ');
              const heading = [e.title, e.company].filter(Boolean).join(' — ');
              return (
                <div key={e.id}>
                  {heading ? (
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="text-[13.5px] font-semibold">{heading}</div>
                      {dates ? (
                        <div className="text-[12px] text-gray-500 shrink-0">{dates}</div>
                      ) : null}
                    </div>
                  ) : null}
                  {e.location ? (
                    <div className="text-[12px] text-gray-500 italic">{e.location}</div>
                  ) : null}
                  {e.achievements.length ? (
                    <ul className="mt-1 list-disc pl-5 text-[13px] text-[#111827] space-y-0.5">
                      {e.achievements.filter((a) => a.trim()).map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Section>
      ) : null}

      {cv.education.length ? (
        <Section label="Education">
          <div className="space-y-3">
            {cv.education.map((ed) => {
              const dates = [ed.startDate, ed.endDate].filter(Boolean).join(' – ');
              const heading = [ed.qualification, ed.school].filter(Boolean).join(' — ');
              return (
                <div key={ed.id}>
                  {heading ? (
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="text-[13.5px] font-semibold">{heading}</div>
                      {dates ? (
                        <div className="text-[12px] text-gray-500 shrink-0">{dates}</div>
                      ) : null}
                    </div>
                  ) : null}
                  {ed.detail ? (
                    <div className="text-[12.5px] text-[#111827]">{ed.detail}</div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Section>
      ) : null}

      {cv.skills.length ? (
        <Section label="Skills">
          <p className="text-[13px] text-[#111827]">{cv.skills.join(' • ')}</p>
        </Section>
      ) : null}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-brand-green">
        {label}
      </div>
      <div className="mt-1 h-px bg-brand-green/40" />
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Placeholder({ text, big }: { text: string; big?: boolean }) {
  return (
    <div className={big ? 'text-[26px] font-extrabold text-gray-300' : 'text-[14px] text-gray-300'}>
      {text}
    </div>
  );
}
