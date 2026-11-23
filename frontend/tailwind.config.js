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
          canvas: "#F8FAFC",  // iOS Canvas Background
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "SF Pro",
          "Noto Sans Devanagari",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        btn: "14px",
        button: "14px",
        card: "18px",
        sheet: "26px",
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
      transitionTimingFunction: {
        spring: "cubic-bezier(0.175, 0.885, 0.32, 1.12)",
        fluid: "cubic-bezier(0.32, 0.72, 0, 1)",
        "spring-bouncy": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "apple-ease": "cubic-bezier(0.25, 0.1, 0.25, 1)",
      },
      boxShadow: {
        "apple-card": "0 2px 8px -1px rgba(15, 23, 42, 0.05), 0 0 0 1px rgba(15, 23, 42, 0.05)",
        "apple-hover": "0 10px 25px -4px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.06)",
        "apple-float": "0 12px 32px -4px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.5)",
        "apple-sheet": "0 -10px 35px -5px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(15, 23, 42, 0.04)",
      },
    },
  },
  plugins: [],
};
