module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    'postcss-font-magician': {
      variants: {
        Inter: {
          400: [],
          500: [],
          600: [],
          700: [],
          800: [],
        },
      },
      foundries: ['google'],
    },
  },
};
