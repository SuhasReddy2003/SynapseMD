import type { Config } from "tailwindcss";

// SynapseMD design tokens.
// Severity semantics are fixed by the product brief: emerald = normal,
// amber = warning, crimson = critical, slate = neutral. Violet is the
// restrained accent reserved for AI/system state, never for clinical severity.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          0: "#05070A",
          50: "#0A0D12",
          100: "#0E1218",
          200: "#12161D",
          300: "#171C24",
          400: "#1F2733",
          500: "#2A3341",
        },
        ink: {
          primary: "#E9EDF3",
          secondary: "#9AA5B4",
          tertiary: "#5F6A79",
          faint: "#3C4552",
        },
        signal: {
          normal: "#2FD08A",
          normalDim: "#173327",
          warning: "#F0B040",
          warningDim: "#3A2C12",
          critical: "#F0475C",
          criticalDim: "#3A1620",
          neutral: "#7C8898",
          neutralDim: "#20262F",
        },
        synapse: {
          DEFAULT: "#7A8CFF",
          dim: "#1C2040",
          bright: "#9AA8FF",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Inter",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SF Mono",
          "Cascadia Code",
          "Roboto Mono",
          "Menlo",
          "monospace",
        ],
      },
      borderRadius: {
        xs: "3px",
        sm: "5px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 12px 24px -12px rgba(0,0,0,0.5)",
        floating: "0 24px 48px -12px rgba(0,0,0,0.6)",
      },
      keyframes: {
        "pulse-live": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scan-line": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "pulse-live": "pulse-live 2.2s ease-in-out infinite",
        "fade-in": "fade-in 0.35s cubic-bezier(0.16,1,0.3,1)",
        "scan-line": "scan-line 1.6s ease-in-out infinite",
      },
      transitionTimingFunction: {
        product: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
