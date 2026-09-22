import clsx from "clsx";
import type { SeverityLevel } from "@/lib/design-tokens";

const dotClasses: Record<SeverityLevel, string> = {
  normal: "bg-signal-normal",
  warning: "bg-signal-warning",
  critical: "bg-signal-critical",
  neutral: "bg-signal-neutral",
};

const textClasses: Record<SeverityLevel, string> = {
  normal: "text-signal-normal",
  warning: "text-signal-warning",
  critical: "text-signal-critical",
  neutral: "text-signal-neutral",
};

const bgClasses: Record<SeverityLevel, string> = {
  normal: "bg-signal-normalDim",
  warning: "bg-signal-warningDim",
  critical: "bg-signal-criticalDim",
  neutral: "bg-signal-neutralDim",
};

export function SeverityDot({
  level,
  pulse = false,
}: {
  level: SeverityLevel;
  pulse?: boolean;
}) {
  return (
    <span className="relative flex h-2 w-2">
      {pulse && (
        <span
          className={clsx(
            "absolute inline-flex h-full w-full animate-pulse-live rounded-full opacity-60",
            dotClasses[level]
          )}
        />
      )}
      <span
        className={clsx(
          "relative inline-flex h-2 w-2 rounded-full",
          dotClasses[level]
        )}
      />
    </span>
  );
}

export function SeverityPill({
  level,
  children,
}: {
  level: SeverityLevel;
  children: React.ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        bgClasses[level],
        textClasses[level]
      )}
    >
      <SeverityDot level={level} />
      {children}
    </span>
  );
}
