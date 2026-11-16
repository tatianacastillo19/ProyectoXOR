/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      colors: {
        lab: {
          950: '#050816',
          900: '#0a0f24',
          850: '#0d142e',
          800: '#111a3a',
          700: '#1a2550',
          600: '#26346b',
        },
      },
      boxShadow: {
        glow: '0 0 24px rgba(34, 211, 238, 0.18)',
        'glow-violet': '0 0 24px rgba(139, 92, 246, 0.18)',
      },
      keyframes: {
        dash: {
          to: { strokeDashoffset: '-24' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        dash: 'dash 1s linear infinite',
        'pulse-soft': 'pulseSoft 1.8s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
        fadeIn: 'fadeIn 220ms ease-out',
      },
    },
  },
  plugins: [],
};
