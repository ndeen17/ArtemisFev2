import { MenuIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';

interface TopBarProps {
  title: string;
  subtitle?: string;
  onOpenSidebar: () => void;
  /**
   * When true the hamburger is shown at every breakpoint — used when the
   * sidebar is hidden (e.g. inline CV builder is open) so the user always
   * has a way back to navigation.
   */
  alwaysShowMenu?: boolean;
}

export function TopBar({ title, subtitle, onOpenSidebar, alwaysShowMenu = false }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 bg-[#fafafa]/95 backdrop-blur border-b border-gray-100">
      <div className="flex items-center justify-between gap-4 h-16 px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenSidebar}
            className={cn(
              'relative text-gray-600 hover:text-gray-900',
              alwaysShowMenu ? '' : 'lg:hidden',
            )}
            aria-label={alwaysShowMenu ? 'Open menu (closes the CV builder)' : 'Open menu'}
            title={alwaysShowMenu ? 'Open menu — closes the CV builder' : undefined}
          >
            <MenuIcon />
            {/* When the builder is open this dot signals that clicking the
                hamburger will exit the editor. Mirrors the Sidebar/Builder
                mutual exclusion in AppShell. */}
            {alwaysShowMenu ? (
              <span
                aria-hidden
                className="absolute -top-0.5 -right-0.5 inline-block h-2 w-2 rounded-full bg-amber-500 ring-2 ring-[#fafafa]"
              />
            ) : null}
          </button>
          <div className="min-w-0">
            <h1 className="text-[18px] font-extrabold tracking-tight text-[#111827] leading-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[12px] text-gray-500 leading-tight truncate">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* The user email used to live here, but Sign out (and the email)
              now live in Settings → Profile. Two entry points was noisy and a
              fat-finger risk on mobile, and the email itself was clutter. */}
        </div>
      </div>
    </header>
  );
}
