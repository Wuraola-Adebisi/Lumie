/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#292522',
        paper: '#fbf8f3',
        muted: '#8b8179',
        coral: '#e98d83',
        lilac: '#d9d2ed',
        butter: '#f1d98b',
        sage: '#cbd8c4',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        soft: '0 12px 40px rgba(61, 45, 36, 0.08)',
      },
    },
  },
  plugins: [],
}
