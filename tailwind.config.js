/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        text: {
          DEFAULT: '#FFFFFF',
          hovered: '#53d7ff',
          secondary: '#DCDCDC',
          success: '#15dc07',
          error: '#f3645b',
        },
        input: {
          background: '#FFFFFF80',
          border: '#C8C8CC',
          placeholder: '#0000009C',
        },
      },
      fontFamily: {
        inter: 'Inter',
      },
      animation: {
        'reverse-spin': 'reverse-spin 1s linear infinite',
      },
      keyframes: {
        'reverse-spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(-360deg)' },
        },
      },
    },
  },
  plugins: [],
};
