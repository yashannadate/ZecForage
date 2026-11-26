import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#000000",
        surface: {
          DEFAULT: "#080808",
          elevated: "#101010",
          border: "#262626",
          subtle: "#050505",
        },
        primary: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#35C9E8",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          DEFAULT: "#35C9E8",
        },
        success: {
          subtle: "#052e16",
          border: "#14532d",
          DEFAULT: "#10b981",
        },
        warning: {
          subtle: "#451a03",
          border: "#78350f",
          DEFAULT: "#f59e0b",
        },
        danger: {
          subtle: "#450a0a",
          border: "#7f1d1d",
          DEFAULT: "#ef4444",
        },
        cyan: {
          300: "#67e8f9",
          400: "#35C9E8",
          DEFAULT: "#35C9E8",
        },
        zcash: {
          yellow: "#F4B728",
          dark: "#1A1A1A",
        },
      },
      fontFamily: {
        sans: ["'Geist'", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["'Geist Mono'", "monospace"],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-7px)" },
        },
        breathe: {
          "0%, 100%": { opacity: "0.42" },
          "50%": { opacity: "0.65" },
        },
      },
      animation: {
        float: "float 14s ease-in-out infinite",
        breathe: "breathe 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
