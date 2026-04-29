import type { ReactNode } from 'react';

/** Marketing layout — wraps public pages (landing, pricing, about). */
export function MarketingLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-white">{children}</div>;
}
