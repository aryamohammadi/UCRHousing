/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#1e3a5f',
          800: '#234b7a',
          700: '#2d5f99',
        },
        gold: {
          500: '#C9A227',
          600: '#B8921F',
        },
        gray: {
          900: '#1A1A1A',
          600: '#4B5563',
          400: '#9CA3AF',
          100: '#F3F4F6',
          50: '#F9FAFB',
        },
        success: '#059669',
        warning: '#D97706',
        error: '#DC2626',
      },
    },
  },
  plugins: [],
}

