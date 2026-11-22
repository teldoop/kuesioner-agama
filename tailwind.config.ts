import type { Config } from 'tailwindcss';
export default {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // black/white mengikuti tema: terang = hitam/putih, gelap = putih-abu/arang
      colors: { black: 'rgb(var(--ink) / <alpha-value>)', white: 'rgb(var(--paper) / <alpha-value>)' },
    },
  },
  plugins: [],
} satisfies Config;
