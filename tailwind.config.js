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
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'float-vertical': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'time-change': {
          '0%': { transform: 'rotateX(0deg)', opacity: '1' },
          '20%': { transform: 'rotateX(90deg)', opacity: '0' },
          '80%': { transform: 'rotateX(-10deg)', opacity: '0.8' },
          '100%': { transform: 'rotateX(0deg)', opacity: '1' },
        }
      },
      animation: {
        'gradient-shift': 'gradient-shift 15s ease infinite',
        'float-slow': 'float-vertical 8s ease-in-out infinite',
        'float-medium': 'float-vertical 6s ease-in-out infinite',
        'float-fast': 'float-vertical 4s ease-in-out infinite',
        'fade-in': 'fade-in 1s ease-out forwards',
        'fade-in-delay': 'fade-in 1s ease-out 0.5s forwards',
        'time-flip': 'time-change 1.5s ease-in-out',
      },
      backgroundSize: {
        '400%': '400% 400%',
      },
    },
  },
  plugins: [],
}

