/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Existing ChatGPT palette ── do not change ──
        chat: {
          bg:       '#212121',
          sidebar:  '#171717',
          bubble:   '#303030',
          accent:   '#10a37f',
        },
        // ── Exploration layer accents ──────────────────
        exploration: {
          bg:      '#1a1a2e',
          indigo:  '#6366f1',
          violet:  '#7c3aed',
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        pulse3:  'pulse3 1.2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulse3: {
          '0%, 100%': { transform: 'scaleY(0.4)', opacity: '0.4' },
          '50%':      { transform: 'scaleY(1)',   opacity: '1'   },
        },
      },
    },
  },
  plugins: [],
}
