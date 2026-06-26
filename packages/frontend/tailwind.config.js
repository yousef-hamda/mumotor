/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ---------------------------------------------------------------
           Apple-style minimal system (June 2026 redesign v2).
           Near-monochrome: white + Apple light-grey + near-black ink, with a
           single restrained blue accent used sparingly for links/CTAs.
           Token NAMES are kept so the thousands of `*-sun-*` / `*-sand-*`
           classes across the app don't need renaming — only values change.

           sand   = the monochrome greyscale (ink, surfaces, borders, muted text)
           sun    = the one accent (Apple blue) — links + primary CTA only
           ember  = red, danger / destructive only
           accent = kept as a neutral alias (no loud colour)
           dawn / brand = back-compat aliases
        --------------------------------------------------------------- */
        sand: {
          50: '#F5F5F7',  // Apple light grey — section bands, cards
          100: '#ECECEE',
          200: '#E2E2E6',  // hairline borders
          300: '#D2D2D7',  // borders / dividers
          400: '#AEAEB2',
          500: '#86868B',  // muted text (Apple grey)
          600: '#6E6E73',  // secondary text
          700: '#424245',
          800: '#2D2D2F',
          900: '#1D1D1F',  // primary ink (Apple near-black)
          950: '#000000',
        },
        sun: {
          50: '#E9F2FE',
          100: '#D0E4FD',
          200: '#A3C9FA',
          300: '#6FAcF5',
          400: '#3B8DEF',
          500: '#0071E3',  // Apple blue (accent / primary CTA)
          600: '#0066CC',  // hover
          700: '#0058B0',
          800: '#004A94',
          900: '#003A75',
          950: '#00264D',
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
        /* neutral alias — no loud colour in the Apple palette */
        accent: {
          50: '#F5F5F7',
          100: '#ECECEE',
          200: '#E2E2E6',
          300: '#D2D2D7',
          400: '#AEAEB2',
          500: '#86868B',
          600: '#6E6E73',
          700: '#424245',
          800: '#2D2D2F',
          900: '#1D1D1F',
          950: '#000000',
        },
        dawn: {
          100: '#ECECEE',
          200: '#E2E2E6',
          300: '#D2D2D7',
          400: '#AEAEB2',
        },
        brand: {
          50: '#E9F2FE',
          100: '#D0E4FD',
          200: '#A3C9FA',
          300: '#6FAcF5',
          400: '#3B8DEF',
          500: '#0071E3',
          600: '#0066CC',
          700: '#0058B0',
          800: '#004A94',
          900: '#003A75',
          950: '#00264D',
        },
      },
      fontFamily: {
        /* system-first so it renders SF Pro on Apple devices (maximally
           "Apple"), with Inter as the clean cross-platform fallback. */
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.022em',
        'apple-tight': '-0.015em',
      },
      boxShadow: {
        /* Apple marketing pages are nearly shadowless; keep these whisper-soft */
        card: '0 1px 3px rgba(0,0,0,0.04), 0 8px 28px -16px rgba(0,0,0,0.10)',
        elevated: '0 12px 40px -12px rgba(0,0,0,0.16)',
        glow: '0 8px 24px -10px rgba(0,113,227,0.40)',
        'glow-sm': '0 4px 14px -8px rgba(0,113,227,0.35)',
        ring: '0 0 0 1px rgba(0,0,0,0.05)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.7)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.75rem',
        '5xl': '2.25rem',
      },
      backgroundImage: {
        'sunrise': 'linear-gradient(120deg, #0071E3 0%, #0058B0 100%)',
        'sunrise-soft': 'linear-gradient(135deg, #F5F5F7 0%, #ECECEE 100%)',
        'dusk': 'linear-gradient(180deg, #000000 0%, #1D1D1F 100%)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        'sun-pulse': { '0%,100%': { opacity: '0.9' }, '50%': { opacity: '1' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both',
        marquee: 'marquee 36s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'sun-pulse': 'sun-pulse 5s ease-in-out infinite',
        shimmer: 'shimmer 2.2s infinite',
      },
    },
  },
  plugins: [],
};
