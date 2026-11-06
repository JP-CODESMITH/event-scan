/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(var(--bg) / <alpha-value>)',
        surface: 'hsl(var(--surface) / <alpha-value>)',
        raised: 'hsl(var(--raised) / <alpha-value>)',
        sunken: 'hsl(var(--sunken) / <alpha-value>)',
        ink: {
          DEFAULT: 'hsl(var(--ink) / <alpha-value>)',
          secondary: 'hsl(var(--ink-secondary) / <alpha-value>)',
          tertiary: 'hsl(var(--ink-tertiary) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'hsl(var(--border) / <alpha-value>)',
          strong: 'hsl(var(--border-strong) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          strong: 'hsl(var(--accent-strong) / <alpha-value>)',
          soft: 'hsl(var(--accent-soft) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'hsl(var(--success) / <alpha-value>)',
          soft: 'hsl(var(--success-soft) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning) / <alpha-value>)',
          soft: 'hsl(var(--warning-soft) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger) / <alpha-value>)',
          soft: 'hsl(var(--danger-soft) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'hsl(var(--info) / <alpha-value>)',
          soft: 'hsl(var(--info-soft) / <alpha-value>)',
        },
        paper: 'hsl(var(--slip) / <alpha-value>)',
        'paper-ink': 'hsl(var(--slip-ink) / <alpha-value>)',
        focus: 'hsl(var(--focus) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Fraunces', 'Iowan Old Style', 'Georgia', 'serif'],
        sans: ['Instrument Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        micro: ['0.6875rem', { lineHeight: '1.2', letterSpacing: '0.09em' }],
        tiny: ['0.75rem', { lineHeight: '1.35', letterSpacing: '0.02em' }],
        small: ['0.8125rem', { lineHeight: '1.45', letterSpacing: '0.005em' }],
        base: ['0.9375rem', { lineHeight: '1.55', letterSpacing: '-0.005em' }],
        body: ['1rem', { lineHeight: '1.55', letterSpacing: '-0.005em' }],
        lead: ['1.125rem', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        title: ['1.375rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        heading: ['1.75rem', { lineHeight: '1.15', letterSpacing: '-0.025em' }],
        display: ['clamp(2.5rem, 6vw, 4.25rem)', { lineHeight: '0.98', letterSpacing: '-0.035em' }],
        'display-sm': ['clamp(2rem, 4.5vw, 3rem)', { lineHeight: '1.02', letterSpacing: '-0.03em' }],
        stamp: ['clamp(2.75rem, 12vw, 5.5rem)', { lineHeight: '0.9', letterSpacing: '-0.04em' }],
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '3px',
        md: '4px',
        lg: '6px',
        xl: '10px',
        full: '9999px',
      },
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '18': '4.5rem',
        '22': '5.5rem',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        in: 'cubic-bezier(0.7, 0, 0.84, 0)',
        inout: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      transitionDuration: {
        fast: '120ms',
        base: '220ms',
        slow: '420ms',
      },
      boxShadow: {
        float: '0 18px 60px hsl(40 13% 5% / 0.22)',
        lift: '0 1px 0 hsl(var(--border)), 0 8px 30px hsl(40 13% 5% / 0.06)',
      },
      keyframes: {
        'stamp-in': {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          '60%': { opacity: '1', transform: 'scale(1.005) translateY(0)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'tick': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(-6px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'sheet-in': {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'stamp-in': 'stamp-in 360ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up': 'slide-up 260ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 180ms ease-out both',
        'tick': 'tick 220ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'toast-in': 'toast-in 180ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'sheet-in': 'sheet-in 300ms cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};
