import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Backed by CSS variables in index.css so the same tokens flip between
        // dark (default) and light themes without rewriting component classes.
        paper: 'var(--c-paper)',
        panel: 'var(--c-panel)',
        panel2: 'var(--c-panel2)',
        line: 'var(--c-line)',
        ink: 'var(--c-ink)',
        secondary: 'var(--c-secondary)',
        muted: 'var(--c-muted)',
        accent: {
          DEFAULT: 'var(--c-accent)',
          cyan: 'var(--c-accent-cyan)',
          violet: 'var(--c-accent-violet)',
        },
        success: 'var(--c-success)',
        verified: 'var(--c-success)',
        warning: 'var(--c-warning)',
        danger: 'var(--c-danger)',
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
