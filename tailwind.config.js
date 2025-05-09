/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
      },
      colors: {
        galaxy: {
          100: '#F8FAFC',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
        },
        dark: {
          50: '#ECEEF1',
          100: '#D9DDE3',
          200: '#B3BBC7',
          300: '#8D99AB',
          400: '#67778F',
          500: '#415573',
          600: '#334459',
          700: '#25333F',
          800: '#172126',
          900: '#0B1013',
          950: '#050608'
        }
      }
    }
  },
  plugins: [],
  darkMode: 'class'
};