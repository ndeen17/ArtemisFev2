import type { ReactNode } from 'react';
import { CheckIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';

interface Props {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

/**
 * Single-select card used by Role / Goal / Experience steps. Generous padding,
 * soft border, and a green check ring when selected — same visual grammar as
 * the landing feature cards.
 */
export function SelectableCard({ selected, onSelect, title, description, icon, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'group w-full text-left rounded-2xl border p-5 transition-all duration-150 flex items-start gap-4',
        selected
          ? 'bg-[#f0fdf4] border-brand-green ring-2 ring-[#dcfce7]'
          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50',
        disabled ? 'opacity-50 pointer-events-none' : '',
      )}
    >
      {icon ? (
        <span className="shrink-0 mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ecfdf5] text-brand-green">
          {icon}
        </span>
      ) : null}
      <span className="flex-1 min-w-0">
        <span className="block text-[16px] font-semibold text-[#111827]">{title}</span>
        {description ? (
          <span className="mt-1 block text-[14px] text-gray-600 leading-relaxed">
            {description}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          'shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full border transition-colors mt-1',
          selected ? 'bg-brand-green border-brand-green' : 'border-gray-300 bg-white',
        )}
        aria-hidden="true"
      >
        {selected ? <CheckIcon stroke="#fff" width={14} height={14} /> : null}
      </span>
    </button>
  );
}
