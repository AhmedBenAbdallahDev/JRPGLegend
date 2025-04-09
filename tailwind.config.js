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
        "primary": "#FF6B6B",
        "main": "#1A1A1A",
        "accent": "#FFD93D",
        "accent-secondary": "#0A2737",
        "error": "#FF6B6B",
        "success": "#16a34a"
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(0deg, rgba(254, 137, 31, 1) 0%, rgba(254, 182, 35, 1) 100%)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      fontFamily: {
        sans: ["var(--body-font)"],
        heading: ["var(--heading-font)"],
      }
    },

  },
  plugins: [],
};
