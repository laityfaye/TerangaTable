import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-heading)', 'Plus Jakarta Sans', 'sans-serif'],
        body: ['var(--font-body)', 'DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        terracotta: {
          DEFAULT: '#C8553D',
          dark: '#A33D28',
          light: '#E8826F',
          50: '#FDF2EF',
          100: '#FAE0DA',
          500: '#C8553D',
          600: '#A84430',
          700: '#8A3526',
        },
        gold: '#D4A843',
        'green-success': '#2D6A4F',
        'bg-dashboard': '#FAFAF8',
        'bg-dark': '#1A1A18',
        border: '#E7E5E4',
        surface: '#FFFFFF',
        'surface-alt': '#F5F4F2',
        // Legacy aliases
        primary: {
          DEFAULT: '#C8553D',
          50: '#FDF2EF',
          100: '#FAE0DA',
          500: '#C8553D',
          600: '#A84430',
          700: '#8A3526',
        },
        secondary: {
          DEFAULT: '#D4A843',
          500: '#D4A843',
          600: '#B38C32',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.08)',
        md: '0 4px 16px rgba(0,0,0,0.10)',
        lg: '0 8px 32px rgba(0,0,0,0.12)',
        glow: '0 0 0 3px rgba(200,85,61,0.15)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-8px) rotate(5deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-6px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(6px)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 8s ease-in-out infinite',
        shake: 'shake 0.5s ease-in-out',
        'fade-in-up': 'fade-in-up 0.4s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
