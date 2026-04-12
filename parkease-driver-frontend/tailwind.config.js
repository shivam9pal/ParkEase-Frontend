/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Periwinkle Pro Palette
        primary: {
          DEFAULT: "#3D52A0",
          hover: "#7091E6",
          foreground: "#ffffff",
        },
        periwinkle: {
          900: "#3D52A0",
          700: "#7091E6",
          500: "#8697C4",
          300: "#ADBBDA",
          100: "#EDE8F5",
        },
        parkease: {
          bg: "#EDE8F5",
          card: "#FFFFFF",
          border: "#ADBBDA",
          navy: "#3D52A0",
          blue: "#7091E6",
          muted: "#8697C4",
          light: "#ADBBDA",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 2px 16px 0 rgba(61,82,160,0.08)",
        "card-hover": "0 4px 24px 0 rgba(61,82,160,0.16)",
        nav: "0 2px 12px 0 rgba(61,82,160,0.12)",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #3D52A0 0%, #7091E6 100%)",
        "card-gradient": "linear-gradient(135deg, #ffffff 0%, #EDE8F5 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};