import type { Config } from 'tailwindcss'

const config: Config = {
  content: [],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#FFF3EC',
          100: '#FFE4CC',
          200: '#FFC9A0',
          300: '#FFAA6E',
          400: '#FF7A30',
          500: '#C44B00',
          600: '#A33D00',
          700: '#7A2E00',
          800: '#521F00',
          900: '#2B1000',
        },
        'bg-dashboard': '#FAFAF8',
        'bg-dark':      '#1A1A18',
        surface: {
          DEFAULT: '#FFFFFF',
          alt:     '#F5F4F2',
        },
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm:   '6px',
        md:   '10px',
        lg:   '16px',
        xl:   '24px',
        '2xl': '32px',
      },
      boxShadow: {
        sm:   '0 1px 3px rgba(0, 0, 0, 0.08)',
        md:   '0 4px 16px rgba(0, 0, 0, 0.10)',
        lg:   '0 8px 32px rgba(0, 0, 0, 0.12)',
        card: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
        glow: '0 0 0 3px rgba(196,75,0,0.15)',
      },
      spacing: {
        xs:    '4px',
        sm:    '8px',
        md:    '16px',
        lg:    '24px',
        xl:    '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
    },
  },
  plugins: [],
}

export default config
