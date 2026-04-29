import type { ReactNode } from 'react';

/**
 * AppShell — authenticated app layout (sidebar + topbar + main content).
 * Phase 4 (Dashboard) will fill in the sidebar/topbar slots.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* TODO(phase-4): <Sidebar /> + <TopBar /> */}
      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-10">{children}</main>
    </div>
  );
}
