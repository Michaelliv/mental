/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Entity colors - warm variants
        domain: '#34d399',
        capability: '#38bdf8',
        aspect: '#a78bfa',
        decision: '#fbbf24',

        // Warm background palette
        warm: {
          deep: '#0c0a09',
          surface: '#141210',
          elevated: '#1c1916',
          hover: 'rgba(255, 244, 230, 0.06)',
        },

        // Warm text palette
        cream: {
          DEFAULT: '#FFF8F0',
          75: 'rgba(255, 248, 240, 0.75)',
          60: 'rgba(255, 248, 240, 0.60)',
          45: 'rgba(255, 248, 240, 0.45)',
          28: 'rgba(255, 248, 240, 0.28)',
        },

        // Warm borders
        border: {
          subtle: 'rgba(255, 244, 230, 0.08)',
          DEFAULT: 'rgba(255, 244, 230, 0.12)',
        },
      },
    },
  },
  plugins: [],
};
