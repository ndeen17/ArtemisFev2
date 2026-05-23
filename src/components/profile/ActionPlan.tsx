import { useMemo, useState } from 'react';
import type {
  ActionPlan as ActionPlanData,
  ActionPlanItem,
  BulletPath,
  CvDetail,
} from '@artemis/shared';
import type { OpenBuilderOptions } from '@/hooks/useBuilderUrlState';
import { findBulletInStructured } from '@artemis/shared';
import { CheckIcon, AlertTriangleIcon, LightbulbIcon, SpinnerIcon } from '@/components/ui/icons';
import { useToggleAction } from '@/hooks/useProfile';
import { useMyCv } from '@/hooks/useOnboarding';
import { RewriteDrawer } from './RewriteDrawer';
import { FixButton } from './FixButton';

/**
 * PRF-06 — Unified action plan. Renders gaps (severity-sorted) then suggestions,
 * each with a checkbox. Completing an action POSTs the toggle and updates locally
 * via the mutation's onSuccess (server returns the recomputed plan).
 *
 * Source labels (CV / LinkedIn) prepare the surface for Phase 6+ when LinkedIn lights up.
 */
const SEVERITY_DOT: Record<'high' | 'medium' | 'low', string> = {
  high: 'bg-rose-500',
  medium: 'bg-amber-400',
  low: 'bg-emerald-400',
};

export function ActionPlan({
  plan,
  isLoading,
  onOpenBuilder,
}: {
  plan: ActionPlanData | undefined;
  isLoading: boolean;
  /** Required: open the inline builder pane focused on the given action. */
  onOpenBuilder: (opts: OpenBuilderOptions) => void;
}) {
  const toggle = useToggleAction();
  const cv = useMyCv();
  const [rewriteTarget, setRewriteTarget] = useState<{
    target: BulletPath;
    original: string;
  } | null>(null);

  if (isLoading || !plan) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-[14px] text-gray-500">
          <SpinnerIcon className="animate-spin" /> Loading actions…
        </div>
      </Card>
    );
  }

  if (plan.totalCount === 0) {
    return (
      <Card>
        <Header completed={0} total={0} />
        <p className="mt-3 text-[14px] text-gray-500">
          No actions yet — your action plan appears once your CV analysis finishes.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <Header completed={plan.completedCount} total={plan.totalCount} />
      <div className="mt-6 space-y-3">
        {plan.items.map((item) => (
          <Row
            key={item.id}
            item={item}
            cv={cv.data ?? null}
            onToggle={() => toggle.mutate({ id: item.id, complete: !item.completed })}
            onRewriteBullet={(target, original) => setRewriteTarget({ target, original })}
            onOpenBuilder={onOpenBuilder}
            disabled={toggle.isPending}
          />
        ))}
      </div>
      {rewriteTarget ? (
        <RewriteDrawer
          target={rewriteTarget.target}
          initialOriginal={rewriteTarget.original}
          onClose={() => setRewriteTarget(null)}
        />
      ) : null}
    </Card>
  );
}

function Header({ completed, total }: { completed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
          Action plan
        </div>
        <h2 className="mt-1 text-[20px] font-semibold text-[#111827]">
          {completed} of {total} done
        </h2>
      </div>
      <div className="w-40">
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-brand-green transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 text-right text-[11px] text-gray-500">{pct}%</div>
      </div>
    </div>
  );
}

function Row({
  item,
  cv,
  onToggle,
  onRewriteBullet,
  onOpenBuilder,
  disabled,
}: {
  item: ActionPlanItem;
  cv: CvDetail | null;
  onToggle: () => void;
  onRewriteBullet: (target: BulletPath, original: string) => void;
  onOpenBuilder: (opts: OpenBuilderOptions) => void;
  disabled: boolean;
}) {
  const Icon = item.kind === 'gap' ? AlertTriangleIcon : LightbulbIcon;

  // Resolve a deep-linkable bullet target if the action quotes one and we
  // can match it in the current structured CV. Recomputed cheaply per render.
  const bulletTarget = useMemo<BulletPath | null>(() => {
    if (!cv || !item.quotedBullet) return null;
    const found = findBulletInStructured(cv.structured ?? null, item.quotedBullet);
    if (!found) return null;
    return { cvId: cv.id, expId: found.expId, bulletIdx: found.bulletIdx };
  }, [cv, item.quotedBullet]);

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
        item.completed ? 'border-gray-100 bg-[#fafafa]' : 'border-gray-100 bg-white'
      }`}
    >
      <div className="flex items-start gap-4">
        <button
          type="button"
          aria-pressed={item.completed}
          aria-label={item.completed ? 'Mark as not done' : 'Mark as done'}
          onClick={onToggle}
          disabled={disabled}
          className={`mt-0.5 shrink-0 w-6 h-6 rounded-full border-2 inline-flex items-center justify-center transition-colors ${
            item.completed
              ? 'bg-brand-green border-brand-green text-white'
              : 'border-gray-300 hover:border-brand-green'
          } disabled:opacity-50`}
        >
          {item.completed && <CheckIcon className="w-4 h-4" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {item.severity && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <span className={`w-2 h-2 rounded-full ${SEVERITY_DOT[item.severity]}`} />
                {item.severity}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <Icon className="w-3 h-3" />
              {item.source}
            </span>
          </div>
          <h3
            className={`mt-1 text-[15px] font-semibold ${
              item.completed ? 'text-gray-500 line-through' : 'text-[#111827]'
            }`}
          >
            {item.title}
          </h3>
          <p
            className={`mt-1 text-[13px] leading-relaxed ${
              item.completed ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {item.detail}
          </p>
          {!item.completed ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {bulletTarget ? (
                <FixButton
                  target={bulletTarget}
                  original={item.quotedBullet ?? ''}
                  actionId={item.id}
                />
              ) : null}
              <button
                type="button"
                onClick={() =>
                  onOpenBuilder({
                    section: item.section,
                    focus: item.id,
                    itemId: item.itemId ?? undefined,
                    coach: true,
                  })
                }
                className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#15803d] hover:underline"
              >
                {bulletTarget ? 'Open in builder' : 'Fix in builder'} →
              </button>
              {bulletTarget ? (
                <button
                  type="button"
                  onClick={() => onRewriteBullet(bulletTarget, item.quotedBullet ?? '')}
                  className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-gray-500 hover:text-[#15803d] hover:underline"
                >
                  See alternatives
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8">
      {children}
    </section>
  );
}
