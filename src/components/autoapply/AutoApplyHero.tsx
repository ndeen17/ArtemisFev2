import { Button } from '@/components/ui/Button';

/** AutoApply — top hero section with headline, subhead, and CTA. */
export function AutoApplyHero() {
  return (
    <main className="w-full bg-white">
      <section className="mx-auto flex max-w-[900px] flex-col items-center px-6 pt-24 pb-48 text-center sm:pt-28 sm:pb-64 lg:pt-32 lg:pb-96">
        <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[64px]">
          <span className="text-[#111827]">Stop Applying for Weeks</span>
          <br />
          <span className="text-[#6b7280]">Start Interviewing in Days</span>
        </h1>

        <p className="mt-6 max-w-[700px] text-base leading-relaxed text-gray-500 sm:text-lg">
          Artemis finds high-match roles, tailors your resume &amp; cover letter, auto-applies,
          and coaches you live &mdash; so you move from submit to getting a job fast.
        </p>

        <div className="mt-10">
          <Button variant="primary" size="lg" href="/signup">
            Get started
          </Button>
        </div>
      </section>
    </main>
  );
}
