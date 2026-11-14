/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        krishi: {
          green: "#2E7D32",   // Primary green
          dark: "#1B5E20",    // Dark green
          light: "#E8F5E9",   // Light green
          orange: "#EF6C00",  // Alert / warning
          blue: "#0277BD",    // Info / water / weather
          red: "#C62828",     // Danger / severe disease
          text: "#1F2937",    // High-contrast text
          grey: "#6B7280",    // Muted grey text
          border: "#D1D5DB",  // Input & card border
          surface: "#FFFFFF", // Clean white card surface
          canvas: "#F9FAFB",  // Background
        },
      },
      borderRadius: {
        btn: "14px",
        button: "14px",
        card: "16px",
      },
      height: {
        btn: "52px",
        touch: "48px",
      },
      minHeight: {
        touch: "48px",
      },
      minWidth: {
        touch: "48px",
      },
    },
  },
  plugins: [],
};
