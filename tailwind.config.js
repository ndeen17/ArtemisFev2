/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  // (When more shadcn components land we'll add tailwindcss-animate here.)
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          // Decorative / accent — used for icon fills, progress bars, dots,
          // and small chips. Has low contrast against white (~3.1:1) so avoid
          // it for body text — use `brand.greenInk` instead.
          green: '#22c55e',
          // Interactive text colour — links, active tab labels, semibold
          // headings on white. WCAG-AA compliant against white (~4.5:1).
          greenInk: '#15803d',
          // Chip / pill background tint. Pairs with `brand.greenInk` text.
          greenSoft: '#dcfce7',
          // Very faint wash for section / banner backgrounds.
          greenWash: '#f0fdf4',
          navy: '#0F172A',
          slate: '#64748B',
          border: '#E2E8F0',
        },
        // Neutral text scale — replaces the hardcoded `#111827` / gray-500
        // values scattered across product surfaces. Use `ink` for body copy.
        ink: {
          DEFAULT: '#111827',
          muted: '#6B7280',
          subtle: '#9CA3AF',
        },
        // Surface scale — replaces the hardcoded `#fafafa` muted card bg
        // sprinkled across profile / settings / dashboard.
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#FAFAFA',
        },
      },
      boxShadow: {
        'green-glow':
          '0 10px 30px -8px rgba(39, 208, 105, 0.45), 0 4px 14px rgba(39, 208, 105, 0.25)',
        // Soft card elevation used across product surfaces — replaces the
        // long inline `shadow-[0_8px_30px_rgba(0,0,0,0.04)]` string.
        card: '0 8px 30px rgba(0, 0, 0, 0.04)',
      },
      maxWidth: {
        shell: '1200px',
      },
    },
  },
  plugins: [],
};
