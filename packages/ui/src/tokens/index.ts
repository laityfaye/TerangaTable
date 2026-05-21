export const colors = {
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
  semantic: {
    success:      '#2D6A4F',
    successLight: '#D1FAE5',
    warning:      '#F59E0B',
    warningLight: '#FEF3C7',
    danger:       '#EF4444',
    dangerLight:  '#FEE2E2',
    info:         '#3B82F6',
    infoLight:    '#DBEAFE',
  },
  neutral: {
    bgDashboard:   '#FAFAF8',
    bgDark:        '#1A1A18',
    textPrimary:   '#1C1917',
    textSecondary: '#57534E',
    border:        '#E7E5E4',
    surface:       '#FFFFFF',
    surfaceAlt:    '#F5F4F2',
  },
} as const

export const typography = {
  fontFamily: {
    display: "'Sora', sans-serif",
    body:    "'DM Sans', sans-serif",
    mono:    "'JetBrains Mono', monospace",
  },
  fontSize: {
    xs:   '0.75rem',
    sm:   '0.875rem',
    base: '1rem',
    lg:   '1.125rem',
    xl:   '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  fontWeight: {
    light:     300,
    regular:   400,
    medium:    500,
    semibold:  600,
    bold:      700,
    extrabold: 800,
  },
  lineHeight: {
    tight:   '1.25',
    snug:    '1.375',
    normal:  '1.5',
    relaxed: '1.625',
    loose:   '2',
  },
} as const

export const spacing = {
  xs:    '0.25rem',
  sm:    '0.5rem',
  md:    '1rem',
  lg:    '1.5rem',
  xl:    '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
} as const

export const radii = {
  sm:   '6px',
  md:   '10px',
  lg:   '16px',
  xl:   '24px',
  full: '9999px',
} as const

export const shadows = {
  sm:   '0 1px 3px rgba(0, 0, 0, 0.08)',
  md:   '0 4px 16px rgba(0, 0, 0, 0.10)',
  lg:   '0 8px 32px rgba(0, 0, 0, 0.12)',
  card: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
  glow: '0 0 0 3px rgba(196, 75, 0, 0.15)',
} as const

export const transitions = {
  fast:   '150ms ease',
  normal: '200ms ease',
  slow:   '300ms ease',
} as const

export const zIndex = {
  dropdown: 10,
  sticky:   20,
  overlay:  30,
  modal:    40,
  toast:    50,
} as const
