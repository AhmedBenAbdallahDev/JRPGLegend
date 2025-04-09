/** @type {import('tailwindcss').Config} */
const { colors: defatColours } = require("tailwindcss/defaultTheme");
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ...defatColours,
        "primary": "#071D2C",
        "main": "#031322",
        "accent": "#446171",
        "accent-secondary": "#0A2737",
        "error": "#dc2626",
        "success": "#16a34a"
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(0deg, rgba(254, 137, 31, 1) 0%, rgba(254, 182, 35, 1) 100%)",
      },
      fontFamily: {
        sans: "var(--body-font)",
      }
    },

  },
  plugins: [],
};
