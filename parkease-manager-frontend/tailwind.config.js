/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3D52A0",
          hover: "#2e3f7c",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#7091E6",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#8697C4",
          foreground: "#3D52A0",
        },
        accent: {
          DEFAULT: "#ADBBDA",
          foreground: "#3D52A0",
        },
        background: "#EDE8F5",
        surface: "#ffffff",
        border: "#ADBBDA",
        parkease: {
          dark:    "#3D52A0",
          mid:     "#7091E6",
          muted:   "#8697C4",
          light:   "#ADBBDA",
          bg:      "#EDE8F5",
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
        card: "0 2px 12px rgba(61, 82, 160, 0.08)",
        "card-hover": "0 4px 20px rgba(61, 82, 160, 0.15)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};