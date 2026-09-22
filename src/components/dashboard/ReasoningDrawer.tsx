"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { SeverityDot } from "@/components/ui/Severity";
import { eventTypeDisplayLabel, eventTypeIcon } from "@/components/dashboard/eventMeta";
import { reasoningProvider } from "@/lib/reasoning-engine";
import type { ClinicalEvent } from "@/lib/types";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function HighlightedSource({ text, highlight }: { text: string; highlight: string }) {
  const index = text.indexOf(highlight);
  if (index === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-[3px] bg-synapse-dim px-0.5 text-synapse-bright">
        {highlight}
      </mark>
      {text.slice(index + highlight.length)}
    </>
  );
}

export function ReasoningDrawer({
  event,
  context,
  onClose,
}: {
  event: ClinicalEvent | null;
  context: ClinicalEvent[];
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const isOpen = event !== null;
  const steps = event ? reasoningProvider.explainEvent(event, context) : [];
  const Icon = event ? eventTypeIcon[event.type] : null;

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ease-product ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Reasoning trace"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl transform border-l border-base-400 bg-base-100 shadow-floating transition-transform duration-300 ease-product ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {event && Icon && (
          <div className="flex w-full flex-col overflow-hidden">
            <div className="panel-header shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-base-400 bg-base-200">
                  <Icon className="h-4 w-4 text-ink-secondary" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-primary">{event.title}</p>
                  <p className="text-[11px] text-ink-tertiary">
                    {eventTypeDisplayLabel[event.type]} · {formatTime(event.timestamp)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close reasoning trace"
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-tertiary transition-colors duration-150 ease-product hover:bg-base-200 hover:text-ink-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid flex-1 grid-cols-1 divide-x divide-base-400 overflow-hidden md:grid-cols-2">
              <div className="overflow-auto p-5">
                <p className="text-xs font-medium text-ink-tertiary">Source record</p>
                <div className="panel mt-3 p-4 text-sm leading-relaxed text-ink-secondary">
                  <HighlightedSource text={event.sourceText} highlight={event.highlight} />
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-ink-tertiary">
                  <SeverityDot level={event.severity} />
                  {event.description}
                </div>
              </div>

              <div className="overflow-auto p-5">
                <p className="text-xs font-medium text-ink-tertiary">Synapse reasoning trace</p>
                <ol className="mt-3 space-y-4">
                  {steps.map((step, i) => (
                    <li key={step.id} className="flex gap-3">
                      <span className="tabular flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-base-400 text-[10px] text-ink-tertiary">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm text-ink-primary">{step.label}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-ink-tertiary">{step.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
