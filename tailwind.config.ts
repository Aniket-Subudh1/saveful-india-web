import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        saveful: {
          cream: "#FAF7F0",
          beige: "#F5F1E8",
          green: {
            DEFAULT: "#2D5F4F",
            light: "#4A8070",
          },
          purple: {
            DEFAULT: "#A68FD9",
            light: "#C4B5E8",
          },
          orange: {
            DEFAULT: "#F7931E",
            light: "#FFB366",
          },
          pink: "#E8B4D9",
          black: "#1a1a1a",
          gray: "#6B6B6B",
        },
      },
      fontFamily: {
        saveful: ["Saveful", "system-ui", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
