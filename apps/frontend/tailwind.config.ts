import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Backed by CSS variables in index.css (RGB channels) so the same tokens
        // flip between dark (default) and light themes AND support Tailwind opacity
        // modifiers (e.g. bg-warning/10) without rewriting component classes.
        paper: 'rgb(var(--c-paper) / <alpha-value>)',
        panel: 'rgb(var(--c-panel) / <alpha-value>)',
        panel2: 'rgb(var(--c-panel2) / <alpha-value>)',
        line: 'var(--c-line)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        secondary: 'rgb(var(--c-secondary) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--c-accent) / <alpha-value>)',
          cyan: 'rgb(var(--c-accent-cyan) / <alpha-value>)',
          violet: 'rgb(var(--c-accent-violet) / <alpha-value>)',
        },
        success: 'rgb(var(--c-success) / <alpha-value>)',
        verified: 'rgb(var(--c-success) / <alpha-value>)',
        warning: 'rgb(var(--c-warning) / <alpha-value>)',
        danger: 'rgb(var(--c-danger) / <alpha-value>)',
      },
      borderRadius: {
        sm: '10px',
        md: '14px',
        lg: '18px',
        xl: '24px',
      },
      fontFamily: {
        sans: [
          'Geist',
          'Inter',
          'SF Pro Display',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      transitionDuration: {
        DEFAULT: '180ms',
      },
    },
  },
  plugins: [],
} satisfies Config;
