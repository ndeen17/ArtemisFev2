import { useState } from 'react';
import Button from './Button.jsx';

const navLinks = [
  { label: 'Resume Builder', href: '#resume' },
  { label: 'AI Interviews', href: '#interviews' },
  { label: 'Mentor Match', href: '#mentors' },
  { label: 'Pricing', href: '#pricing' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-4 z-30 w-full px-4 sm:px-6 lg:px-8">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-full border border-gray-100 bg-white/95 px-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur sm:h-[72px] sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="#" className="flex items-center">
          <img src="/assets/logo.png" alt="Artemis" className="h-8 w-auto object-contain" />
        </a>

        {/* Desktop nav */}
        <ul className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="text-[15px] font-medium text-gray-700 transition-colors hover:text-[#111827]"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center gap-3">
          <Button variant="primary" href="#start">
            Get started
          </Button>
          <Button variant="outline" href="#login">
            Login
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-[#111827] hover:bg-gray-100"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden mx-auto mt-2 max-w-7xl rounded-2xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <ul className="flex flex-col gap-1 px-4 py-4">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="block rounded-lg px-3 py-2 text-[15px] font-medium text-gray-700 hover:bg-gray-50 hover:text-[#111827]"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="mt-3 flex flex-col gap-2">
              <Button variant="primary" href="#start" className="w-full">
                Get started
              </Button>
              <Button variant="outline" href="#login" className="w-full">
                Login
              </Button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
