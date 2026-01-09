/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ensuring we have access to standard slate if it was overridden (it shouldn't be)
      }
    },
  },
  plugins: [],
  darkMode: 'class', // Enable manual dark mode toggle compatibility
}
