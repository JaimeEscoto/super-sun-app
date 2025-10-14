import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const resolveFromRoot = (relativePath: string) =>
  fileURLToPath(new URL(relativePath, import.meta.url));

const srcPath = resolveFromRoot('./src/');

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@',
        replacement: srcPath
      },
      {
        find: /^@\//,
        replacement: `${srcPath}`
      }
    ]
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  plugins: [react()]
});
