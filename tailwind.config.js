/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        termius: {
          bg: '#0d1117',
          sidebar: '#161b22',
          surface: '#1c2128',
          card: '#22272e',
          border: '#30363d',
          accent: '#58a6ff',
          success: '#3fb950',
          warning: '#d29922',
          danger: '#f85149',
          purple: '#bc8cff',
        }
      }
    },
  },
  plugins: [],
}
