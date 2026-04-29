import { Link } from 'react-router-dom';
import type { BulletFeedback as BulletFeedbackItem } from '@artemis/shared';
import { CheckIcon, AlertTriangleIcon, ArrowRightIcon } from '@/components/ui/icons';

/**
 * PRF-02 — Bullet-by-bullet feedback list. Each row shows the original bullet,
 * a status pill (good/improve/missing), the coach's note, optional improved example,
 * and a "Rewrite" deep link that prefills the rewriter with this bullet.
 */
const STATUS = {
  good: { label: 'Good', dot: 'bg-[#dcfce7] text-[#15803d]', icon: CheckIcon },
  improve: { label: 'Improve', dot: 'bg-amber-50 text-amber-700', icon: AlertTriangleIcon },
  missing: { label: 'Missing', dot: 'bg-rose-50 text-rose-600', icon: AlertTriangleIcon },
} as const;

export function BulletFeedbackList({ items }: { items: BulletFeedbackItem[] }) {
  if (items.length === 0) {
    return (
      <div className="text-[14px] text-gray-500">
        No bullet-level feedback was returned for this CV.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {items.map((b, i) => (
        <BulletRow key={i} bullet={b} />
      ))}
    </div>
  );
}

function BulletRow({ bullet }: { bullet: BulletFeedbackItem }) {
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
        {bullet.status !== 'good' && (
          <Link
            to={`/profile/cv/rewrite?bullet=${encodeURIComponent(bullet.original)}`}
            className="shrink-0 inline-flex items-center gap-1 text-[13px] font-semibold text-[#15803d] hover:underline"
          >
            Rewrite <ArrowRightIcon className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
