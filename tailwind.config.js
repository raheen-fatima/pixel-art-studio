/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0e0e10',
          900: '#151517',
          850: '#1a1a1d',
          800: '#1f1f23',
          700: '#2a2a2f',
          600: '#38383f',
          500: '#57575f',
        },
        paper: {
          100: '#f1efe9',
          300: '#c9c6bd',
          500: '#8b8a86',
        },
        phosphor: {
          DEFAULT: '#7ee787',
          dim: '#4f9d58',
          bright: '#a8f5ae',
        },
        amber: {
          DEFAULT: '#e8a33d',
        },
        danger: {
          DEFAULT: '#e5534b',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'checker': "linear-gradient(45deg, #26262b 25%, transparent 25%), linear-gradient(-45deg, #26262b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #26262b 75%), linear-gradient(-45deg, transparent 75%, #26262b 75%)",
      },
      backgroundSize: {
        'checker-sm': '16px 16px',
      },
      boxShadow: {
        panel: 'inset 0 1px 0 0 rgba(255,255,255,0.03)',
      },
    },
  },
  plugins: [],
};