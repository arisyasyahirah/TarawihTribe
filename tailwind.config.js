/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f172a',
          surface: '#1e293b',
          card: 'rgba(30,20,50,0.85)',
          border: '#1e293b',
          text: '#e2e8f0',
          muted: '#94a3b8',
        },
        purple: {
          primary: '#a855f7',
          secondary: '#6366f1',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        glass: '32px',
      }
    },
  },
  plugins: [],
}
