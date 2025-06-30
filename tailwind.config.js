/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-green': '#16a34a',
        'secondary-green': '#22c55e',
        'light-green-bg': '#dcfce7',
        'dark-text': '#1e293b',
        'light-text': '#64748b',
      }
    },
  },
  plugins: [],
}