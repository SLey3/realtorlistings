/** @type {import('tailwindcss').Config} */
import flowbite from 'flowbite-react/tailwind';

export default {
  darkMode: 'selector',
  content: [
    "./index.html",
    './src/**/*.{js,jsx,ts,tsx}',
    flowbite.content(),
  ],
  theme: {
    container: {
      center: true
    },
    extend: {},
  },
  plugins: [
    flowbite.plugin()
  ],
}

