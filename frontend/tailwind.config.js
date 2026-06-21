/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        'fifa-dark': '#0a0a1a',
        'fifa-darker': '#050510',
        'fifa-gold': '#c8a84b',
        'fifa-gold-light': '#f0d060',
        'fifa-silver': '#a8a9ad',
      },
      fontFamily: {
        fifa: ['Rajdhani', 'Oswald', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
