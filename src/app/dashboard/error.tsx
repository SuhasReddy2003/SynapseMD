"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Synthetic-data prototype: log to console rather than a real error-tracking service.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-base-50 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-base-400 bg-base-200">
        <AlertTriangle className="h-5 w-5 text-signal-warning" strokeWidth={1.5} />
      </div>
      <div className="max-w-sm space-y-1.5">
        <p className="text-sm font-medium text-ink-primary">Something went wrong</p>
        <p className="text-sm leading-relaxed text-ink-tertiary">
          This is a research prototype and hit an unexpected error. No real
          patient data is involved — it&apos;s safe to try again.
        </p>
      </div>
      <Button variant="primary" size="md" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
