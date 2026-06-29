/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@devdocs/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    fs: { allow: ['../..'] },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
  },
});
