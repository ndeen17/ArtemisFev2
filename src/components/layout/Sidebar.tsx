import { NavLink, Link } from 'react-router-dom';
import {
  HomeIcon,
  UserIcon,
  BriefcaseIcon,
  MicIcon,
  LockIcon,
  CloseIcon,
  SettingsIcon,
} from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import type { ComponentType, SVGProps } from 'react';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** When true the item is disabled with a "Soon" badge — for unshipped phases. */
  comingSoon?: boolean;
}

const items: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { to: '/profile', label: 'Profile', icon: UserIcon },
  { to: '/applications', label: 'Applications', icon: BriefcaseIcon },
  { to: '/interviews', label: 'Interviews', icon: MicIcon },
  { to: '/settings/profile', label: 'Settings', icon: SettingsIcon },
];

interface SidebarProps {
  /** Mobile drawer state. Desktop ignores both. */
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-black/30 transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col',
          'transition-transform duration-200 ease-out lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:static lg:translate-x-0',
        )}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-gray-100">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-[16px] font-extrabold tracking-tight text-[#111827]"
            aria-label="Artemis dashboard"
          >
            <span
              aria-hidden="true"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-green/15 ring-1 ring-brand-green/30"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 text-brand-green"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 18 L20 6" />
                <path d="M14 6 L20 6 L20 12" />
                <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
              </svg>
            </span>
            Artemis
          </Link>
          <button
            type="button"
            className="lg:hidden text-gray-500 hover:text-gray-800"
            onClick={onClose}
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {items.map((item) => (
            <SidebarLink key={item.to} item={item} onNavigate={onClose} />
          ))}
        </nav>

        <div className="px-6 py-5 border-t border-gray-100">
          <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-gray-400 mb-1">
            Build status
          </p>
          <p className="text-[12px] text-gray-500 leading-snug">
            Profile, applications, and text-mode mock interviews are live. Voice mode ships next.
          </p>
        </div>
      </aside>
    </>
  );
}

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const Icon = item.icon;
  if (item.comingSoon) {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-[14px]',
          'text-gray-400 cursor-not-allowed select-none',
        )}
        aria-disabled
      >
        <span className="flex items-center gap-3">
          <Icon className="w-[18px] h-[18px]" />
          {item.label}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase text-gray-500">
          <LockIcon className="w-3 h-3" /> Soon
        </span>
      </div>
    );
  }
  return (
    <NavLink
      to={item.to}
      end={item.to === '/dashboard'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] font-medium transition-colors',
          isActive
            ? 'bg-[#dcfce7] text-[#15803d]'
            : 'text-gray-700 hover:bg-gray-50 hover:text-[#111827]',
        )
      }
    >
      <Icon className="w-[18px] h-[18px]" />
      {item.label}
    </NavLink>
  );
}
