/**
 * Single source of truth for color values that need to be read in JS —
 * chart strokes, canvas/SVG fills, anywhere Tailwind classes can't reach.
 * Keep these in sync with tailwind.config.ts. Components should prefer
 * Tailwind utility classes; reach for these tokens only where a raw
 * hex value is required (e.g. Recharts `stroke` props).
 */
export const colors = {
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
} as const;

export type SeverityLevel = "normal" | "warning" | "critical" | "neutral";

export const severityColor: Record<SeverityLevel, string> = {
  normal: colors.signal.normal,
  warning: colors.signal.warning,
  critical: colors.signal.critical,
  neutral: colors.signal.neutral,
};

export const severityDimColor: Record<SeverityLevel, string> = {
  normal: colors.signal.normalDim,
  warning: colors.signal.warningDim,
  critical: colors.signal.criticalDim,
  neutral: colors.signal.neutralDim,
};
