/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        domain: '#10b981', // green
        capability: '#3b82f6', // blue
        aspect: '#a855f7', // purple
        decision: '#f59e0b', // yellow
      },
    },
  },
  plugins: [],
};
