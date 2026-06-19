import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type {
  ActionPlan as ActionPlanData,
  ActionPlanItem,
  BulletPath,
  CvDetail,
} from '@artemis/shared';
import type { OpenBuilderOptions } from '@/hooks/useBuilderUrlState';
import { findBulletInStructured } from '@artemis/shared';
import {
  CheckIcon,
  AlertTriangleIcon,
  LightbulbIcon,
  SpinnerIcon,
  ChevronDownIcon,
} from '@/components/ui/icons';
import { useToggleAction } from '@/hooks/useProfile';
import { useMyCv } from '@/hooks/useOnboarding';
import { RewriteDrawer } from './RewriteDrawer';

/** Number of high-priority actions shown above the fold; the rest expand on demand. */
const DEFAULT_VISIBLE = 3;

const SEVERITY_DOT: Record<'high' | 'medium' | 'low', string> = {
  high: 'bg-rose-500',
  medium: 'bg-amber-500',
  low: 'bg-emerald-500',
};

export function ActionPlan({
  plan,
  isLoading,
  onOpenBuilder,
  activeFocusId,
}: {
  plan: ActionPlanData | undefined;
  isLoading: boolean;
  onOpenBuilder: (opts: OpenBuilderOptions) => void;
  /** The action item id currently open in the builder — highlights that card. */
  activeFocusId?: string | null;
}) {
  const toggle = useToggleAction();
  const cv = useMyCv();
  const [rewriteTarget, setRewriteTarget] = useState<{
    target: BulletPath;
    original: string;
  } | null>(null);
  const [showAll, setShowAll] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.hash !== '#actions') return;
    const el = document.getElementById('actions');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

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
          Nothing to fix right now — your top things to fix appear here once Artemis
          finishes analysing your CV.
        </p>
      </Card>
    );
  }

  const remaining = Math.max(0, plan.items.length - DEFAULT_VISIBLE);
  const visibleItems = showAll ? plan.items : plan.items.slice(0, DEFAULT_VISIBLE);

  return (
    <Card>
      <Header completed={plan.completedCount} total={plan.totalCount} />
      <div className="mt-6 space-y-3">
        {visibleItems.map((item) => (
          <Row
            key={item.id}
            item={item}
            cv={cv.data ?? null}
            onToggle={() => toggle.mutate({ id: item.id, complete: !item.completed })}
            onRewriteBullet={(target, original) => setRewriteTarget({ target, original })}
            onOpenBuilder={onOpenBuilder}
            disabled={toggle.isPending}
            isActive={item.id === activeFocusId}
          />
        ))}
      </div>
      {remaining > 0 ? (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#15803d] hover:underline"
          aria-expanded={showAll}
        >
          {showAll ? 'Show fewer' : `Show all ${plan.items.length} actions`}
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`}
          />
        </button>
      ) : null}
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
  const subtitle =
    total === 0
      ? 'Nothing to fix yet'
      : completed === total
        ? 'Everything done — nice work'
        : `Work through these to lift your score · ${completed}/${total} done`;
  return (
    <div id="actions" className="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
          Your next moves
        </div>
        <h2 className="mt-1 text-[20px] font-semibold text-[#111827]">
          Top things to fix
        </h2>
        <p className="mt-1 text-[13px] text-gray-500">{subtitle}</p>
      </div>
      {total > 0 ? (
        <div className="w-40">
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-brand-green transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1 text-right text-[11px] text-gray-500">{pct}%</div>
        </div>
      ) : null}
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
  isActive,
}: {
  item: ActionPlanItem;
  cv: CvDetail | null;
  onToggle: () => void;
  onRewriteBullet: (target: BulletPath, original: string) => void;
  onOpenBuilder: (opts: OpenBuilderOptions) => void;
  disabled: boolean;
  isActive: boolean;
}) {
  const Icon = item.kind === 'gap' ? AlertTriangleIcon : LightbulbIcon;
  const rowRef = useRef<HTMLDivElement>(null);

  const bulletTarget = useMemo<BulletPath | null>(() => {
    if (!cv || !item.quotedBullet) return null;
    const found = findBulletInStructured(cv.structured ?? null, item.quotedBullet);
    if (!found) return null;
    return { cvId: cv.id, expId: found.expId, bulletIdx: found.bulletIdx };
  }, [cv, item.quotedBullet]);

  const isUnanchoredExpOrEdu =
    (item.section === 'experience' || item.section === 'education') && !item.itemId;

  // Scroll the highlighted card into view when it becomes active (e.g. user
  // clicked it and the builder opened; left panel may have scrolled).
  useEffect(() => {
    if (!isActive || !rowRef.current) return;
    rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [isActive]);

  const openBuilderOpts: OpenBuilderOptions = {
    section: item.section,
    focus: item.id,
    itemId: item.itemId ?? undefined,
    bulletIndex: item.bulletIndex ?? null,
    why: item.detail,
  };

  return (
    <div
      ref={rowRef}
      // Entire card opens the builder for incomplete items. Checkbox and
      // "See alternatives" stop propagation so they don't also fire this.
      onClick={() => {
        if (!item.completed) onOpenBuilder(openBuilderOpts);
      }}
      className={[
        'rounded-2xl border p-4 sm:p-5 transition-all duration-150 outline-none',
        item.completed
          ? 'border-gray-100 bg-[#fafafa]'
          : isActive
            ? 'border-brand-green/50 bg-brand-green/[0.04] ring-2 ring-brand-green/25 cursor-pointer'
            : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm cursor-pointer',
      ].join(' ')}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox — stop propagation so it doesn't trigger the card click */}
        <button
          type="button"
          aria-pressed={item.completed}
          aria-label={item.completed ? 'Mark as not done' : 'Mark as done'}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
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
          {/* Badges row */}
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
            {/* "Editing" pill — only visible while this card's builder is open */}
            {isActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-green/10 px-2 py-0.5 text-[11px] font-semibold text-brand-green">
                Editing
              </span>
            )}
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

          {/* Action bar — only on incomplete items */}
          {!item.completed ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {/* See alternatives — stop propagation so it opens the drawer, not the builder */}
              {bulletTarget ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRewriteBullet(bulletTarget, item.quotedBullet ?? '');
                  }}
                  className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-gray-500 hover:text-[#15803d] hover:underline"
                >
                  See alternatives
                </button>
              ) : null}

              {/* Right-aligned CTA — shows "Editing now" when active, else "Open in builder →" */}
              <span className="ml-auto">
                {isActive ? (
                  <span className="text-[12px] font-semibold text-brand-green">
                    Editing now ✓
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      // Card already handles open; stop propagation to avoid double call.
                      e.stopPropagation();
                      onOpenBuilder(openBuilderOpts);
                    }}
                    className={
                      isUnanchoredExpOrEdu
                        ? 'text-[12.5px] font-semibold text-gray-500 hover:underline'
                        : 'text-[12.5px] font-semibold text-[#15803d] hover:underline'
                    }
                    title={
                      isUnanchoredExpOrEdu
                        ? 'Lands on the section header — no specific entry identified'
                        : undefined
                    }
                  >
                    Open in builder →
                  </button>
                )}
              </span>
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
