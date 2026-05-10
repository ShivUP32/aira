import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEEDFB",
          100: "#D5D3F6",
          200: "#ABA7EE",
          300: "#817BE5",
          400: "#574FDC",
          500: "#534AB7",
          600: "#4239A0",
          700: "#322C88",
          800: "#211E71",
          900: "#11105A",
          950: "#080840",
        },
        indigo: {
          50: "#EEEDFB",
          100: "#D5D3F6",
          200: "#ABA7EE",
          300: "#817BE5",
          400: "#574FDC",
          500: "#534AB7",
          600: "#4239A0",
          700: "#322C88",
          800: "#211E71",
          900: "#11105A",
          950: "#080840",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
