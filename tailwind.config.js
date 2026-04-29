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
          green: '#22c55e',
          navy: '#0F172A',
          slate: '#64748B',
          border: '#E2E8F0',
        },
      },
      boxShadow: {
        'green-glow':
          '0 10px 30px -8px rgba(39, 208, 105, 0.45), 0 4px 14px rgba(39, 208, 105, 0.25)',
      },
      maxWidth: {
        shell: '1200px',
      },
    },
  },
  plugins: [],
};
