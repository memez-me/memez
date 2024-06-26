const plugin = require('tailwindcss/plugin');

const spacings = {
  'x0.5': '4px',
  x1: '8px',
  x2: '16px',
  x3: '24px',
  x4: '32px',
  x5: '40px',
  x6: '48px',
  x7: '56px',
  x8: '64px',
  x9: '72px',
  x10: '80px',
  x11: '88px',
  x12: '96px',
};

/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        main: {
          accent: '#92FFCB',
          light: '#00FF85',
          shadow: '#20573D',
          gray: '#313D38',
          grey: '#47514C',
          black: '#000A05',
        },
        second: {
          sell: '#FF6B4A',
          error: '#FF532E',
          warning: '#FFC700',
          success: '#2FFF50',
        },
        shadow: {
          text: 'rgba(0, 255, 133, 0.50)',
        },
      },
      opacity: {
        16: '0.16',
      },
      boxShadow: {
        element:
          '0px 0px 8px 0px var(--tw-shadow-color, rgba(0, 255, 133, 0.50))',
      },
      textShadow: {
        DEFAULT: '0px 0px 20px var(--tw-shadow-color, rgba(0, 255, 133, 0.50))',
      },
      spacing: spacings,
      borderRadius: spacings,
      fontSize: {
        headline: '32px',
        'headline-2': '24px',
        title: '20px',
        body: '17px',
        'body-2': '15px',
        footnote: '13px',
      },
      fontWeight: {
        regular: '400',
      },
      letterSpacing: {
        body: '0.51px',
        footnote: '0.39px',
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
  plugins: [
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          'text-shadow': (value) => ({
            textShadow: value,
          }),
        },
        { values: theme('textShadow') },
      );
    }),
  ],
};
