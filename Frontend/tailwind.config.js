/** @type {import('tailwindcss').Config} */
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7fad49',
          hover: '#6e9a40',      // đậm hơn chút khi hover
          light: '#eef7e5',      // nền nhạt
          'dark-light': '#3f5e2b', // dùng cho dark mode
        }
      },
      fontFamily: {
        sans: ['Sora', 'sans-serif'],
      }
    },
  },
  plugins: [],
}