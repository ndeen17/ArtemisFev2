import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Inline form error — small, red, generous top spacing for breathing room. */
export function FormError({ children, className }: { children?: ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <p className={cn('mt-1.5 text-[13px] text-red-600', className)} role="alert">
      {children}
    </p>
  );
}
