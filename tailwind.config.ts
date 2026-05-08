import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "forge-bg": "#0a0a0f",
        "forge-surface": "#12121a",
        "forge-border": "#1e1e2e",
        "forge-cyan": "#06d6a0",
        "forge-violet": "#8b5cf6",
        "forge-emerald": "#10b981",
        "forge-amber": "#f59e0b",
        "forge-red": "#ef4444",
        "forge-blue": "#3b82f6",
        "forge-text": "#e2e8f0",
        "forge-muted": "#64748b",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
