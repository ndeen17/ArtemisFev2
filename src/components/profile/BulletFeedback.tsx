import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { BulletFeedback as BulletFeedbackItem, BulletPath } from '@artemis/shared';
import { findBulletInStructured, findRepeatedVerbs, suggestVerbAlternatives } from '@artemis/shared';
import { CheckIcon, AlertTriangleIcon, ArrowRightIcon } from '@/components/ui/icons';
import { useMyCv } from '@/hooks/useOnboarding';
import { RewriteDrawer } from './RewriteDrawer';

/**
 * PRF-02 — Bullet-by-bullet feedback list. Each row shows the original bullet,
 * a status pill (good/improve/missing), the coach's note, optional improved example,
 * and a "Rewrite" CTA. When the bullet text matches a slot in the user's structured
 * CV we open a targeted RewriteDrawer (with Apply); otherwise we fall back to the
 * legacy free-form rewriter page so behaviour never regresses.
 */
const STATUS = {
  good: { label: 'Good', dot: 'bg-[#dcfce7] text-[#15803d]', icon: CheckIcon },
  improve: { label: 'Improve', dot: 'bg-amber-50 text-amber-700', icon: AlertTriangleIcon },
  missing: { label: 'Missing', dot: 'bg-rose-50 text-rose-600', icon: AlertTriangleIcon },
} as const;

export function BulletFeedbackList({ items }: { items: BulletFeedbackItem[] }) {
  const cv = useMyCv();
  const [target, setTarget] = useState<{ target: BulletPath; original: string } | null>(null);

  const repeatedVerbs = cv.data?.structured?.experience
    ? findRepeatedVerbs(cv.data.structured.experience)
    : [];

  if (items.length === 0) {
    return (
      <div className="text-[14px] text-gray-500">
        No bullet-level feedback was returned for this CV.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {repeatedVerbs.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-amber-700">
            Verb variety
          </div>
          <p className="mt-1 text-[13px] text-amber-900">
            Some bullet openers repeat within the same role — applicant tracking systems and
            reviewers both pick this up. Try swapping in fresh alternatives:
          </p>
          <ul className="mt-3 space-y-2">
            {repeatedVerbs.map((rv) => {
              const alts = suggestVerbAlternatives(rv.verb, [rv.verb], 4);
              return (
                <li key={`${rv.roleIndex}-${rv.verb}`} className="text-[13px]">
                  <span className="font-semibold text-amber-900">
                    “{rv.verb}” × {rv.count}
                  </span>{' '}
                  <span className="text-amber-800">in {rv.roleLabel}</span>
                  {alts.length > 0 ? (
                    <span className="ml-1 text-amber-800">
                      → try{' '}
                      {alts.map((a, idx) => (
                        <span
                          key={a}
                          className="inline-flex items-center rounded-full bg-white ring-1 ring-amber-200 px-2 py-0.5 mr-1 text-[12px] font-medium text-amber-900"
                        >
                          {a}
                          {idx < alts.length - 1 ? '' : ''}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {items.map((b, i) => {
        const found = cv.data
          ? findBulletInStructured(cv.data.structured ?? null, b.original)
          : null;
        const bulletTarget: BulletPath | null =
          found && cv.data
            ? { cvId: cv.data.id, expId: found.expId, bulletIdx: found.bulletIdx }
            : null;
        return (
          <BulletRow
            key={i}
            bullet={b}
            bulletTarget={bulletTarget}
            onRewrite={(t, original) => setTarget({ target: t, original })}
          />
        );
      })}
      {target ? (
        <RewriteDrawer
          target={target.target}
          initialOriginal={target.original}
          onClose={() => setTarget(null)}
        />
      ) : null}
    </div>
  );
}

function BulletRow({
  bullet,
  bulletTarget,
  onRewrite,
}: {
  bullet: BulletFeedbackItem;
  bulletTarget: BulletPath | null;
  onRewrite: (target: BulletPath, original: string) => void;
}) {
  const meta = STATUS[bullet.status];
  const Icon = meta.icon;
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${meta.dot}`}
          >
            <Icon className="w-3 h-3" />
            {meta.label}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] text-[#111827] leading-relaxed break-words">
              {bullet.original}
            </p>
            <p className="mt-2 text-[13px] text-gray-600 leading-relaxed">{bullet.suggestion}</p>
            {bullet.improvedExample && (
              <div className="mt-3 rounded-xl bg-[#fafafa] border border-gray-100 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 mb-1">
                  Try
                </div>
                <p className="text-[13px] text-[#111827]">{bullet.improvedExample}</p>
              </div>
            )}
          </div>
        </div>
        {bullet.status !== 'good' &&
          (bulletTarget ? (
            <button
              type="button"
              onClick={() => onRewrite(bulletTarget, bullet.original)}
              className="shrink-0 inline-flex items-center gap-1 text-[13px] font-semibold text-[#15803d] hover:underline"
            >
              Rewrite <ArrowRightIcon className="w-4 h-4" />
            </button>
          ) : (
            <Link
              to={`/profile/cv/rewrite?bullet=${encodeURIComponent(bullet.original)}`}
              className="shrink-0 inline-flex items-center gap-1 text-[13px] font-semibold text-[#15803d] hover:underline"
            >
              Rewrite <ArrowRightIcon className="w-4 h-4" />
            </Link>
          ))}
      </div>
    </div>
  );
}
