/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/pages/MarketplacePage.jsx'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      // Raised type scale — default Tailwind sizes read too small for our users
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1.15rem' }],   // 13px (was 12px)
        sm: ['0.9375rem', { lineHeight: '1.35rem' }],   // 15px (was 14px)
        base: ['1.0625rem', { lineHeight: '1.6rem' }],  // 17px (was 16px)
        lg: ['1.1875rem', { lineHeight: '1.75rem' }],   // 19px (was 18px)
      },
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
