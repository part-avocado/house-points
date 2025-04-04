/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        'highlight-up': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' },
        },
        'highlight-down': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(4px)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' },
        },
      },
      animation: {
        'highlight-up': 'highlight-up 1s ease-in-out',
        'highlight-down': 'highlight-down 1s ease-in-out',
      },
    },
  },
  plugins: [],
}

