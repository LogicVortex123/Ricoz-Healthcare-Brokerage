import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0E5566',
          hover: '#0A4352',
          50: '#EEF7F8',
          100: '#D5EDF0',
          200: '#A9D9E0',
          500: '#0E5566',
          600: '#0A4352',
          700: '#083642',
          900: '#05222A',
        },
        accent: {
          DEFAULT: '#14B8A6',
          soft: '#CCFBF1',
        },
        ink: {
          DEFAULT: '#0F172A',
          muted: '#64748B',
          light: '#94A3B8',
        },
        surface: {
          DEFAULT: '#F6F7F9',
          subtle: '#F1F3F6',
          card: '#FFFFFF',
        },
        border: {
          DEFAULT: '#E5E8ED',
          subtle: '#EEF0F3',
        },
        success: { DEFAULT: '#15803D', light: '#ECFDF3' },
        warning: { DEFAULT: '#B45309', light: '#FFFBEB' },
        danger: { DEFAULT: '#B42318', light: '#FEF3F2' },
        info: { DEFAULT: '#1D4ED8', light: '#EFF6FF' },
        sidebar: {
          DEFAULT: '#0A2A33',
          deep: '#071E25',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        card: '14px',
        input: '8px',
        button: '8px',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.04)',
        card: '0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.05)',
        lift: '0 8px 24px -6px rgba(15, 23, 42, 0.12), 0 2px 6px -2px rgba(15, 23, 42, 0.06)',
        elevation: '0 20px 48px -12px rgba(15, 23, 42, 0.25)',
        glow: '0 0 0 4px rgba(20, 184, 166, 0.15)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.97)' }, to: { opacity: '1', transform: 'scale(1)' } },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-up': 'slide-up 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slide-in-right 260ms cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 180ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
