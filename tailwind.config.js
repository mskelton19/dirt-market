/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
      './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            300: '#7dd3fc',
            400: '#38bdf8',
            500: '#0ea5e9',
            600: '#0284c7',
            700: '#0369a1',
            800: '#075985',
            900: '#0c4a6e',
          },
        },
        fontSize: {
          'display': ['4rem', { lineHeight: '1.2' }],
          'heading': ['2.5rem', { lineHeight: '1.3' }],
          'subheading': ['1.5rem', { lineHeight: '1.5' }],
          'body': ['1.125rem', { lineHeight: '1.6' }],
        },
        spacing: {
          'section': '6rem',
        },
      },
    },
    plugins: [
      require('@tailwindcss/forms'),
    ],
  }