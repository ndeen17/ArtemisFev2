import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { cn } from '@/lib/cn';

interface Props {
  children: ReactNode;
  /** Page-specific subtitle in the AppShell topbar. */
  subtitle?: string;
}

const TABS = [
  { to: '/settings/profile', label: 'Profile' },
  { to: '/settings/goal', label: 'Goal' },
  { to: '/settings/resume', label: 'Resume' },
];

/**
 * Shared shell for /settings/* pages. Renders a horizontal tab bar so the user
 * can move between Profile (name), Goal, and Resume without leaving the
 * settings context.
 */
export function SettingsLayout({ children, subtitle }: Props) {
  return (
    <AppShell title="Settings" subtitle={subtitle ?? 'Update your account, goal, and resume.'}>
      <div className="space-y-6">
        <nav
          aria-label="Settings sections"
          className="flex gap-1 overflow-x-auto rounded-2xl border border-gray-100 bg-white p-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.03)]"
        >
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end
              className={({ isActive }) =>
                cn(
                  'shrink-0 rounded-xl px-4 py-2 text-[13px] font-semibold transition-colors',
                  isActive
                    ? 'bg-[#dcfce7] text-[#15803d]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#111827]',
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
        {children}
      </div>
    </AppShell>
  );
}
