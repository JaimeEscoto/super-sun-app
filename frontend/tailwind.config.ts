import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#f97316',
        secondary: '#0f172a'
      }
    }
  },
  plugins: []
};

export default config;
