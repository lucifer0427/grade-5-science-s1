/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        sun: {
          light: '#fef08a',
          DEFAULT: '#fbbf24',
          dark: '#f59e0b'
        },
        sky: {
          light: '#e0f2fe',
          DEFAULT: '#38bdf8',
          dark: '#0284c7'
        }
      }
    },
  },
  plugins: [],
}
