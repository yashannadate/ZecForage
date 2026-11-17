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
        background: "#080C14",
        surface: {
          DEFAULT: "#0F1626",
          elevated: "#151F36",
          border: "#1E2A47",
          subtle: "#121A2D",
        },
        primary: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          DEFAULT: "#7c3aed",
        },
        success: {
          subtle: "#06281D",
          border: "#0E563F",
          DEFAULT: "#10b981",
        },
        warning: {
          subtle: "#2A1D07",
          border: "#644610",
          DEFAULT: "#f59e0b",
        },
        danger: {
          subtle: "#2C0F14",
          border: "#6E1E26",
          DEFAULT: "#ef4444",
        },
        zcash: {
          yellow: "#F4B728",
          dark: "#1A1A1A",
        }
      },
      fontFamily: {
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
