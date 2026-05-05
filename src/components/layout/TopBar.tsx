import { useAuthStore } from '@/store/authStore';
import { MenuIcon } from '@/components/ui/icons';

interface TopBarProps {
  title: string;
  subtitle?: string;
  onOpenSidebar: () => void;
}

export function TopBar({ title, subtitle, onOpenSidebar }: TopBarProps) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-20 bg-[#fafafa]/95 backdrop-blur border-b border-gray-100">
      <div className="flex items-center justify-between gap-4 h-16 px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="lg:hidden text-gray-600 hover:text-gray-900"
            aria-label="Open menu"
          >
            <MenuIcon />
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
          {/* Sign out lives in Settings → Profile (Account section) — having two
              entry points was noisy and a fat-finger risk on mobile. */}
          <span className="text-[13px] text-gray-500 hidden sm:inline truncate max-w-[180px]">
            {user?.email}
          </span>
        </div>
      </div>
    </header>
  );
}
