import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3B5BDB",
        "price-green": "#16A34A",
        "star-yellow": "#F59E0B",
        border: "#E2E8F0",
        "dark-text": "#1E293B",
        "medium-text": "#64748B",
        "light-bg": "#F8FAFC",
        "nav-start": "#EEF2FF",
        "nav-end": "#E0E7FF",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
