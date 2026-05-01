import type { ReactNode } from 'react';

interface Props {
  current: number;
  total: number;
  label?: string;
}

/**
 * Wizard progress indicator. Segmented bar (matches landing's clean lines) with
 * a small step counter. `current` is 1-based.
 */
export function ProgressDots({ current, total, label }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex items-center gap-2"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label={label ?? `Step ${current} of ${total}`}
      >
        {Array.from({ length: total }).map((_, i) => {
          const filled = i < current;
          return (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                filled ? 'bg-brand-green' : 'bg-gray-200'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

interface HeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
}

export function StepHeader({ eyebrow, title, subtitle }: HeaderProps) {
  return (
    <div className="space-y-2">
      {eyebrow ? (
        <div className="text-[14px] font-semibold text-brand-green">
          {eyebrow}
        </div>
      ) : null}
      <h1 className="text-[32px] sm:text-[40px] font-extrabold tracking-tight text-[#111827] leading-[1.1]">
        {title}
      </h1>
      {subtitle ? <p className="text-[16px] text-gray-600 leading-relaxed">{subtitle}</p> : null}
    </div>
  );
}
