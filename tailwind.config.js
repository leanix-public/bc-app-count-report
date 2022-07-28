const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
    './node_modules/lxr-ui/dist/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Axiforma-Regular', ...defaultTheme.fontFamily.sans],
        'axiforma-bold': ['Axiforma-Bold', ...defaultTheme.fontFamily.sans]
      }
    }
  },
  plugins: [
  ]
}
