import { useEffect, useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { UndoToastHost } from '@/components/feedback/UndoToastHost';
import { useBuilderUrlState } from '@/hooks/useBuilderUrlState';

interface AppShellProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

/**
 * AppShell — authenticated app layout. Sidebar (collapsible on mobile) +
 * sticky TopBar + scrollable main content. All authed pages render inside this.
 *
 * When the inline CV builder is open (URL has `?builder=1`), the persistent
 * desktop sidebar collapses to give the editor more room. The TopBar then
 * surfaces a hamburger at every breakpoint so the user can re-open the
 * sidebar on demand. Doing so automatically closes the builder via
 * `useBuilderUrlState`'s `close()` so the layout never has to handle a
 * builder + open-sidebar collision.
 */
export function AppShell({ children, title, subtitle }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const builder = useBuilderUrlState();
  const builderOpen = builder.state.isOpen;

  // Defensive: if the user navigates away to a page without ?builder=1
  // while the mobile drawer is somehow still open, close it. Keeps the
  // drawer state from sticking across route transitions.
  useEffect(() => {
    if (!builderOpen) return;
    setSidebarOpen(false);
  }, [builderOpen]);

  // Clicking the hamburger while the builder is open closes the builder
  // and opens the sidebar in one motion. This is what makes "open sidebar"
  // and "edit CV" mutually exclusive without forcing the user to manage it.
  const handleOpenSidebar = () => {
    if (builderOpen) builder.close();
    setSidebarOpen(true);
  };

  return (
    <div className="h-screen overflow-hidden bg-[#fafafa] flex">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={builderOpen}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          title={title}
          subtitle={subtitle}
          onOpenSidebar={handleOpenSidebar}
          alwaysShowMenu={builderOpen}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Tighter side padding on mobile so cards don't get clipped at
              the gutter. The horizontal-scroll guard above prevents any
              runaway child from sliding the whole viewport. */}
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 space-y-8 min-w-0">
            {children}
          </div>
        </main>
      </div>
      <UndoToastHost />
    </div>
  );
}
