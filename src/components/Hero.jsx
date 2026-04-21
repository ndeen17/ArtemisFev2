import Button from './Button.jsx';

export default function Hero() {
  return (
    <main className="w-full bg-white">
      {/* Hero text + CTA */}
      <section className="mx-auto flex max-w-[900px] flex-col items-center px-6 pt-24 text-center sm:pt-28 lg:pt-32">
        <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
          <span className="text-[#111827]">Land the job,</span>
          <br />
          <span className="text-[#6b7280]">not just another application.</span>
        </h1>

        <p className="mt-6 max-w-[700px] text-base leading-relaxed text-gray-500 sm:text-lg">
          Artemis helps you improve your resume, practice real interviews, and get expert
          guidance — so you’re actually ready when it counts.
        </p>

        <div className="mt-10">
          <Button variant="primary" size="lg" href="#start">
            Get started
          </Button>
        </div>
      </section>

      {/* Illustration */}
      <section className="mx-auto flex w-full justify-center px-6 pt-16 pb-20 sm:pt-20">
        <img
          src="/assets/globe.png"
          alt="Illustration of a globe with orbital rings"
          className="w-full max-w-[640px] opacity-95 select-none"
          draggable="false"
        />
      </section>
    </main>
  );
}
