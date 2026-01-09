/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Corporate dark palette
        corporate: {
          bg: {
            primary: '#0a0a0b',
            secondary: '#141416',
            tertiary: '#1c1c1f',
          },
          surface: {
            DEFAULT: '#232327',
            elevated: '#2a2a2f',
            hover: '#323238',
          },
          border: {
            DEFAULT: '#3a3a42',
            light: '#4a4a52',
            focus: '#5a5a62',
          },
          text: {
            primary: '#f5f5f7',
            secondary: '#a1a1aa',
            tertiary: '#71717a',
          },
          accent: {
            primary: '#3b82f6',
            secondary: '#60a5fa',
            hover: '#2563eb',
          },
          success: {
            DEFAULT: '#10b981',
            light: '#34d399',
          },
          warning: {
            DEFAULT: '#f59e0b',
            light: '#fbbf24',
          },
          error: {
            DEFAULT: '#ef4444',
            light: '#f87171',
          },
        },
      },
      borderRadius: {
        'corporate': '0.75rem',
        'corporate-lg': '1rem',
      },
      boxShadow: {
        'corporate': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'corporate-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}
