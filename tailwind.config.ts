import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/game/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gta: {
          pink: "#ff3e9d",
          orange: "#ff8c38",
          purple: "#7c3aed",
          cyan: "#00f0ff",
          dark: "#07080f",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Impact", "Haettenschweiler", "Arial Narrow Bold", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
