/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Neutral graphite palette inspired by Vercel's dark UI.
        slate: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#111111',
          950: '#050505',
        },
        mint: {
          50: '#effcf6',
          100: '#d8f7e8',
          200: '#b5efd5',
          300: '#7fe2b8',
          400: '#3ed096',
          500: '#00b981',
          600: '#00a172',
          700: '#047f5f',
          800: '#06654f',
          900: '#075241',
          950: '#012f26',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'card': '0 12px 28px -24px rgba(0, 0, 0, 0.45)',
        'card-hover': '0 18px 44px -28px rgba(0, 0, 0, 0.55)',
        'premium': '0 24px 60px -36px rgba(0, 0, 0, 0.75)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
    },
  },
  plugins: [],
}
