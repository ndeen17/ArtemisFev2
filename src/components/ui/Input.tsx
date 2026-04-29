import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Adds error styling (red ring) when set. */
  invalid?: boolean;
};

/**
 * Input — design-consistent with the landing's soft-card aesthetic:
 * rounded, subtle border, brand-green focus ring, generous padding.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, type = 'text', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'block w-full rounded-2xl border bg-white px-4 py-3 text-[15px] text-[#111827] placeholder:text-[#9ca3af]',
        'transition-shadow duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent',
        invalid ? 'border-red-200 focus:ring-red-300' : 'border-gray-200 focus:ring-brand-green',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  );
});
