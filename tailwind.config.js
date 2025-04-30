/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "nairobi-green": "#007A33", // Primary green
        "nairobi-blue": "#003087", // Dark blue
        "nairobi-light-gray": "#F5F6F5", // Light background
        "nairobi-dark-gray": "#333333", // Text
        "nairobi-orange": "#F5A623", // Accent
        "nairobi-dark": "#1A2526", // Dark header/footer
        "nairobi-light-green": "#E6F0EA", // Light green background
      },
    },
  },
  plugins: [],
};