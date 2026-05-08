import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 24px 80px -36px rgba(15, 23, 42, 0.24)",
      },
    },
  },
  plugins: [],
};

export default config;