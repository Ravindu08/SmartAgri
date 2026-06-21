/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/pages/MarketplacePage.jsx'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        input: 'var(--input-border)',
        ring: 'var(--accent)',
        background: 'var(--bg)',
        foreground: 'var(--text)',
        primary: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-text)',
        },
        secondary: {
          DEFAULT: 'var(--surface-1)',
          foreground: 'var(--text)',
        },
        destructive: {
          DEFAULT: 'var(--red)',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: 'var(--surface-1)',
          foreground: 'var(--muted)',
        },
        accent: {
          DEFAULT: 'var(--accent-light)',
          foreground: 'var(--text)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--text)',
        },
        success: {
          DEFAULT: 'var(--green)',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: 'var(--amber)',
        },
        info: {
          DEFAULT: 'var(--blue)',
        },
        harvest: {
          DEFAULT: 'var(--green-mid)',
        },
      },
    },
  },
  plugins: [],
};
