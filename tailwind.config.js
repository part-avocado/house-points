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
        'digit-change': {
          '0%': { 
            transform: 'scale(1)',
            filter: 'blur(0px)',
            opacity: '1'
          },
          '50%': { 
            transform: 'scale(1.05)',
            filter: 'blur(0.3px)',
            opacity: '0.9'
          },
          '100%': { 
            transform: 'scale(1)',
            filter: 'blur(0px)',
            opacity: '1'
          }
        },
        'time-change': {
          '0%': { transform: 'rotateX(0deg)', opacity: '1' },
          '20%': { transform: 'rotateX(90deg)', opacity: '0' },
          '80%': { transform: 'rotateX(-10deg)', opacity: '0.8' },
          '100%': { transform: 'rotateX(0deg)', opacity: '1' },
        },
        'time-flip': {
          '0%': { transform: 'rotateX(0deg)' },
          '100%': { transform: 'rotateX(360deg)' },
        },
        'float-xl': {
          '0%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(100px, 100px)' },
          '100%': { transform: 'translate(0, 0)' },
        },
        'float-large': {
          '0%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(80px, 80px)' },
          '100%': { transform: 'translate(0, 0)' },
        },
        'float-medium': {
          '0%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(60px, 60px)' },
          '100%': { transform: 'translate(0, 0)' },
        },
        'float-fast': {
          '0%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(40px, 40px)' },
          '100%': { transform: 'translate(0, 0)' },
        },
      },
      animation: {
        'gradient-shift': 'gradient-shift 15s ease infinite',
        'float-slow': 'float-vertical 8s ease-in-out infinite',
        'float-medium': 'float-vertical 6s ease-in-out infinite',
        'float-fast': 'float-vertical 4s ease-in-out infinite',
        'fade-in': 'fade-in 1s ease-out forwards',
        'fade-in-delay': 'fade-in 1s ease-out 0.5s forwards',
        'digit-change': 'digit-change 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'time-flip': 'time-flip 0.5s ease-in-out',
        'float-xl': 'float-xl 12s ease-in-out infinite',
        'float-reverse-xl': 'float-xl 12s ease-in-out infinite reverse',
        'float-large': 'float-large 10s ease-in-out infinite',
        'float-medium': 'float-medium 8s ease-in-out infinite',
        'float-reverse-medium': 'float-medium 8s ease-in-out infinite reverse',
        'float-fast': 'float-fast 6s ease-in-out infinite',
        'float-reverse-fast': 'float-fast 6s ease-in-out infinite reverse',
        'float-slow': 'float-large 14s ease-in-out infinite',
      },
      backgroundSize: {
        '400%': '400% 400%',
      },
    },
  },
  plugins: [],
}

