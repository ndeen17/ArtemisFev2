import { Link, useSearchParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { CVRewriter } from '@/components/profile/CVRewriter';
import { ArrowLeftIcon } from '@/components/ui/icons';

/**
 * PRF-03 — CV rewriter page. Accepts an optional `?bullet=` query param so deep
 * links from BulletFeedback land prefilled.
 */
export default function CvRewriterPage() {
  const [params] = useSearchParams();
  const initialBullet = params.get('bullet') ?? '';

  return (
    <AppShell title="Rewrite a bullet" subtitle="Sharper, action-led, quantified">
      <div>
        <Link
          to="/profile/cv"
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-gray-600 hover:text-[#15803d]"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to CV analysis
        </Link>
      </div>

      <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8">
        <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
          Bullet rewriter
        </div>
        <h2 className="mt-1 text-[20px] font-semibold text-[#111827]">
          Paste a bullet, get three angles
        </h2>
        <p className="mt-1 text-[13px] text-gray-500 max-w-xl">
          Artemis returns one strongest rewrite plus two alternatives with different angles (impact,
          scope, leadership). Numbers it can&apos;t verify are flagged with placeholders like{' '}
          <span className="font-mono">[X%]</span>.
        </p>
      </section>

      <CVRewriter initialBullet={initialBullet} />
    </AppShell>
  );
}
