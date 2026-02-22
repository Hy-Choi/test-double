import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        slateBlue: "#28334a",
        softCream: "#f7f4ef",
        accentMint: "#4ea68f",
        warmGray: "#615d56"
      },
      boxShadow: {
        card: "0 8px 24px rgba(15, 23, 42, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
