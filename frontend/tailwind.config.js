/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Risk-level colors (used consistently across map, cards, charts).
        safe: { DEFAULT: "#16a34a", bg: "#052e18", light: "#22c55e" },
        watch: { DEFAULT: "#ca8a04", bg: "#3a2e05", light: "#eab308" },
        warning: { DEFAULT: "#ea580c", bg: "#3a1a05", light: "#f97316" },
        evacuate: { DEFAULT: "#dc2626", bg: "#3a0a0a", light: "#ef4444" },
        offline: { DEFAULT: "#6b7280", bg: "#1f2937", light: "#9ca3af" },
        // Base surfaces: deep slate-blue, evokes dusk over the ridgeline.
        surface: {
          950: "#0a0f14",
          900: "#0f1620",
          800: "#161f2c",
          700: "#1e2a3a",
          600: "#2a3a4d",
        },
        accent: {
          DEFAULT: "#3b9dd8",
          light: "#6ec3f2",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        sans: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
