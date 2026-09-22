import type { LucideIcon } from "lucide-react";
import { SeverityDot } from "@/components/ui/Severity";

export function SectionEmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-base-400 bg-base-200">
        <Icon className="h-5 w-5 text-ink-tertiary" strokeWidth={1.5} />
      </div>
      <div className="max-w-sm space-y-1.5">
        <p className="text-sm font-medium text-ink-primary">{title}</p>
        <p className="text-sm leading-relaxed text-ink-tertiary">
          {description}
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-ink-faint">
        <SeverityDot level="neutral" />
        Data engine not yet connected in this build
      </div>
    </div>
  );
}
