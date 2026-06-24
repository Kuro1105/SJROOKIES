/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#fef2f4',
          100: '#fde0e5',
          200: '#fbc5cf',
          300: '#f89aab',
          400: '#f36079',
          500: '#e8334f',
          600: '#d41840',
          700: '#b21237',
          800: '#8B1A2E',
          900: '#701426',
        },
        sand: {
          50:  '#faf9f6',
          100: '#f5f2ea',
          200: '#edeae1',
          300: '#e0ddd4',
          400: '#c9c4b8',
        },
      },
    },
  },
  plugins: [],
}
