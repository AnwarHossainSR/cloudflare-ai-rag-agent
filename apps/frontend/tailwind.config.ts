import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111827',
        paper: '#F7FAF8',
        panel: '#FFFFFF',
        line: '#D7E0DD',
        muted: '#64748B',
        verified: '#047857',
        warning: '#B45309',
        danger: '#B91C1C',
      },
    },
  },
  plugins: [],
} satisfies Config;
