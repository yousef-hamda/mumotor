/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ---------------------------------------------------------------
           Trust-blue corporate system (June 2026 redesign).
           The historical token NAMES are kept on purpose so the thousands
           of `*-sun-*` / `*-sand-*` classes across the app don't need to be
           renamed — only their values change.

           sand   = neutral slate canvas + navy ink (text, surfaces, borders)
           sun    = blue, the PRIMARY brand colour / main CTA
           ember  = red, reserved for danger / destructive only
           accent = orange, a single restrained highlight (eyebrows, dots,
                    "live" indicators) — never a competing primary button
           dawn   = orange tints, kept only for backward-compatible refs
           brand  = alias of sun (blue)
        --------------------------------------------------------------- */
        sand: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        sun: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
          800: '#1E3A8A',
          900: '#172554',
          950: '#0F1A3D',
        },
        ember: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
          950: '#450A0A',
        },
        accent: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          950: '#431407',
        },
        dawn: {
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
        },
        /* keep `brand` as an alias to sun so any stray references still resolve */
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
          800: '#1E3A8A',
          900: '#172554',
          950: '#0F1A3D',
        },
      },
      fontFamily: {
        /* one clean grotesk for everything — no serif display (the serif +
           gradient headline was the biggest "AI template" tell) */
        sans: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      boxShadow: {
        /* neutral, restrained elevation — flat design uses shadow sparingly */
        card: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px -4px rgba(15,23,42,0.08)',
        elevated: '0 20px 40px -16px rgba(15,23,42,0.16), 0 4px 12px -6px rgba(15,23,42,0.08)',
        glow: '0 8px 24px -8px rgba(37,99,235,0.35)',
        'glow-sm': '0 4px 14px -6px rgba(37,99,235,0.30)',
        ring: '0 0 0 1px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.7)',
      },
      borderRadius: {
        /* tightened from the old pill-heavy scale to a corporate radius set */
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      backgroundImage: {
        /* kept for backward-compat; flattened to subtle, professional fills */
        'sunrise': 'linear-gradient(120deg, #2563EB 0%, #1D4ED8 100%)',
        'sunrise-soft': 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
        'dusk': 'linear-gradient(160deg, #0F172A 0%, #1E293B 60%, #172554 100%)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        /* legacy keyframes kept so any stray class references still resolve */
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        'sun-pulse': { '0%,100%': { opacity: '0.9' }, '50%': { opacity: '1' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both',
        marquee: 'marquee 36s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'sun-pulse': 'sun-pulse 5s ease-in-out infinite',
        shimmer: 'shimmer 2.2s infinite',
      },
    },
  },
  plugins: [],
};
