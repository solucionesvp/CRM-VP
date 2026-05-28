/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FC6621',
        secondary: '#111111',
        background: '#F7F7F5',
        surface: '#FFFFFF',
        border: '#E5E5E5',
        text: '#111111',
        textMuted: '#5F5F5F',
        brandOrange: '#FC6621',
        brandDark: '#111111',
        brandMuted: '#5F5F5F',
      },
      fontFamily: {
        sans: ['Myriad Pro', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['Keep Calm Medium', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
