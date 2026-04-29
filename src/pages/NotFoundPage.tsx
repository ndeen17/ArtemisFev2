import { Link } from 'react-router-dom';

/** Generic 404 page for unmatched routes. */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-[#22c55e]">404</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[#111827] sm:text-5xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-base text-[#6b7280]">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-brand-green px-8 py-3 text-[15px] font-semibold text-[#111827] hover:brightness-105"
      >
        Back to home
      </Link>
    </div>
  );
}
