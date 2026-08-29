import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAFAF6",
        ink: "#20242B",
        sub: "#6B7280",
        line: "#E2E4DE",
        navy: { DEFAULT: "#25436B", soft: "#EDF2F9" },
        wrong: { DEFAULT: "#C4453B", soft: "#FBEEED" },
        unsure: { DEFAULT: "#C07A16", soft: "#FBF3E4" },
        correct: { DEFAULT: "#2E7D4F", soft: "#EAF4EE" },
      },
      borderRadius: { card: "14px" },
    },
  },
  plugins: [],
};
export default config;
