import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface AppShellProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

/**
 * AppShell — authenticated app layout. Sidebar (collapsible on mobile) +
 * sticky TopBar + scrollable main content. All authed pages render inside this.
 */
export function AppShell({ children, title, subtitle }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#fafafa] flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar title={title} subtitle={subtitle} onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1">
          <div className="mx-auto max-w-6xl px-6 lg:px-10 py-8 lg:py-10 space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
