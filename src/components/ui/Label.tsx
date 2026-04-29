import type { LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('block text-[14px] font-medium text-[#111827] mb-1.5', className)}
      {...props}
    />
  );
}
