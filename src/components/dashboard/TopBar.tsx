import Link from "next/link";
import { SeverityDot } from "@/components/ui/Severity";
import { Button } from "@/components/ui/Button";

export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-base-400 bg-base-50/95 px-5 backdrop-blur">
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-ink-primary">Arthur Pendelton</p>
        <span className="h-3 w-px bg-base-400" />
        <p className="text-sm text-ink-tertiary">68 · Post-CABG · Day 2</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-xs text-ink-tertiary">
          <SeverityDot level="critical" pulse />
          1 unresolved signal
        </span>
        <Link href="/">
          <Button variant="ghost" size="sm">
            Exit demo
          </Button>
        </Link>
      </div>
    </header>
  );
}
