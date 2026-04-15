/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3D52A0",
          hover: "#2e3f7a",
        },
        accent: {
          DEFAULT: "#7091E6",
          hover: "#5a7ad4",
        },
        secondary: {
          DEFAULT: "#8697C4",
        },
        muted: {
          DEFAULT: "#ADBBDA",
          foreground: "#6b7a9e",
        },
        surface: {
          DEFAULT: "#EDE8F5",
          card: "#ffffff",
        },
        sidebar: {
          DEFAULT: "#3D52A0",
          hover: "#4a61b8",
          active: "#7091E6",
          text: "#EDE8F5",
          muted: "#ADBBDA",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(61, 82, 160, 0.08), 0 1px 2px -1px rgba(61, 82, 160, 0.06)",
        "card-hover": "0 4px 12px 0 rgba(61, 82, 160, 0.15)",
      },
    },
  },
  plugins: [],
};