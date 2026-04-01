/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2f497f', // primary-600
          50: '#eff1f7',
          100: '#d9deea',
          200: '#b3bdd6',
          300: '#8c9dc1',
          400: '#667cac',
          500: '#405b97',
          600: '#2f497f',
          700: '#243a66',
          800: '#192a4d',
          900: '#10214b',
          950: '#0a142e',
        },
        secondary: {
          DEFAULT: '#bfa56f', // secondary-600
          50: '#f8f2e6',
          100: '#f1e5cc',
          200: '#e5d2a6',
          300: '#d9bf7f',
          400: '#d0ad63',
          500: '#d7bd88',
          600: '#bfa56f',
          700: '#9f875a',
          800: '#7b6a47',
          900: '#5a4d35',
          950: '#382f1e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}
