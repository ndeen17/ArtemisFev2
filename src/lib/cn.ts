import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Conditional + deduped Tailwind class composer. Used by all shadcn-style components. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
