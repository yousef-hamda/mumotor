/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Single restrained accent — a confident, corporate blue. Used sparingly
        // for links, focus rings and active states. Primary actions use ink (zinc-900).
        brand: {
          50: '#eef3ff',
          100: '#dbe5ff',
          200: '#bdd0ff',
          300: '#92b0ff',
          400: '#6086fa',
          500: '#3b62f0',
          600: '#2444dc',
          700: '#1d34bd',
          800: '#1d2f99',
          900: '#1d2d79',
          950: '#161d4a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)',
        elevated: '0 8px 24px -6px rgba(16,24,40,0.12), 0 2px 6px rgba(16,24,40,0.06)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
