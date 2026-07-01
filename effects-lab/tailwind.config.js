/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#06070a',
          900: '#0b0d12',
          800: '#11141b',
          700: '#1a1e28',
          600: '#272c3a',
        },
        accent: '#5ea8f2',
        accent2: '#a78bfa',
      },
      fontFamily: {
        sans: ['"Roboto Flex"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
