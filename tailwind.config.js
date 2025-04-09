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
        "primary": "var(--primary)",
        "main": "var(--main)",
        "accent": "var(--accent)",
        "accent-secondary": "var(--accent-secondary)",
        "error": "var(--error)",
        "success": "var(--success)"
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(0deg, rgba(254, 137, 31, 1) 0%, rgba(254, 182, 35, 1) 100%)"
      },
      fontFamily: {
        sans: "var(--body-font)",
        heading: "var(--heading-font)"
      }
    },
  },
  plugins: [],
};
