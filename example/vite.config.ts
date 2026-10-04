import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: import.meta.dirname,
  resolve: {
    alias: { '@excalibur-spritefusion': path.join(import.meta.dirname, '../src/index.ts') }
  },
  server: {
    fs: {
      // src/ lives outside the vite root, so it has to be explicitly allowed
      allow: [path.join(import.meta.dirname, '..')]
    }
  }
});
