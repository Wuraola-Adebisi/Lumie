/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14193f',
        navy: '#121c5a',
        cobalt: '#1f4fd6',
        cream: '#fbf2dd',
        paper: '#fff8e8',
        tomato: '#ee4a2f',
        bubblegum: '#f7b4c6',
        saffron: '#f2b632',
        moss: '#2f8a50',
        lilac: '#cbb8f0',
        sky: '#a9d4ef',
        lime: '#dcf28b',
        muted: '#555d85',
      },
      fontFamily: {
        sans: ['Figtree', 'system-ui', 'sans-serif'],
        display: ['MuseoModerno', 'Figtree', 'sans-serif'],
        serif: ['DM Serif Display', 'Georgia', 'serif'],
        type: ['Courier Prime', 'Courier New', 'monospace'],
        hand: ['Caveat', 'cursive'],
      },
      boxShadow: {
        lift: '0 1px 1px rgba(18,28,90,.18), 0 8px 14px -6px rgba(18,28,90,.30), 0 22px 40px -14px rgba(18,28,90,.35)',
      },
    },
  },
  plugins: [],
}
