/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Dark "oxblood clay" system.
           sand  = warm bone neutral canvas + espresso ink
           sun   = oxblood clay, the primary accent / brand colour (name kept to
                   avoid class churn across the whole app)
           ember = deeper brick, the secondary accent for gradients + danger
           dawn  = muted clay-peach used at the warm end of gradients */
        sand: {
          50: '#F6EFE8',
          100: '#EFE4D8',
          200: '#E3D3C5',
          300: '#CDB8A6',
          400: '#AD9280',
          500: '#8A715E',
          600: '#6B5546',
          700: '#4E3D32',
          800: '#322720',
          900: '#241813',
          950: '#1C1210',
        },
        sun: {
          50: '#F7EEEA',
          100: '#EFDAD3',
          200: '#E0B9AD',
          300: '#C9907F',
          400: '#A8604F',
          500: '#7E3B32',
          600: '#6E3328',
          700: '#561F1A',
          800: '#461A16',
          900: '#3A1713',
          950: '#2A100C',
        },
        ember: {
          50: '#FBEDE9',
          100: '#F6D6CD',
          200: '#E9AE9F',
          300: '#D9806C',
          400: '#C25741',
          500: '#A53B28',
          600: '#8C2F1E',
          700: '#722619',
          800: '#5E2016',
          900: '#4E1C14',
          950: '#2C0E09',
        },
        dawn: {
          100: '#F3DCCF',
          200: '#E8BEA8',
          300: '#D89C80',
          400: '#C9805F',
        },
        /* keep `brand` as an alias to sun so any stray references still resolve */
        brand: {
          50: '#F7EEEA',
          100: '#EFDAD3',
          200: '#E0B9AD',
          300: '#C9907F',
          400: '#A8604F',
          500: '#7E3B32',
          600: '#6E3328',
          700: '#561F1A',
          800: '#461A16',
          900: '#3A1713',
          950: '#2A100C',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Fraunces', '"Plus Jakarta Sans"', 'Georgia', 'serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      boxShadow: {
        card: '0 1px 2px rgba(58,38,16,0.04), 0 6px 16px -6px rgba(120,76,24,0.10)',
        elevated: '0 22px 48px -16px rgba(120,72,20,0.22), 0 6px 16px -8px rgba(120,72,20,0.12)',
        glow: '0 14px 36px -10px rgba(126,59,50,0.55)',
        'glow-sm': '0 8px 20px -8px rgba(126,59,50,0.5)',
        ring: '0 0 0 1px rgba(34,28,21,0.06), 0 1px 2px rgba(34,28,21,0.05)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.6)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.625rem',
        '4xl': '2.25rem',
      },
      backgroundImage: {
        'sunrise': 'linear-gradient(120deg, #C9907F 0%, #A8604F 30%, #7E3B32 70%, #561F1A 100%)',
        'sunrise-soft': 'linear-gradient(135deg, #F3DCCF 0%, #E0B9AD 50%, #C9907F 100%)',
        'dusk': 'linear-gradient(160deg, #1C1210 0%, #322720 55%, #4E3D32 100%)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(18px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        'float-slow': { '0%,100%': { transform: 'translateY(0) rotate(0deg)' }, '50%': { transform: 'translateY(-22px) rotate(2deg)' } },
        'sun-pulse': { '0%,100%': { opacity: '0.75', transform: 'scale(1)' }, '50%': { opacity: '1', transform: 'scale(1.06)' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'gradient-pan': { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        'spin-slow': { '100%': { transform: 'rotate(360deg)' } },
        'road-dash': { '0%': { backgroundPosition: '0 0' }, '100%': { backgroundPosition: '-80px 0' } },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
        'sun-pulse': 'sun-pulse 5s ease-in-out infinite',
        marquee: 'marquee 32s linear infinite',
        shimmer: 'shimmer 2.2s infinite',
        'gradient-pan': 'gradient-pan 8s ease infinite',
        'spin-slow': 'spin-slow 24s linear infinite',
        'road-dash': 'road-dash 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
