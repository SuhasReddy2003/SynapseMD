"use client";

import { useMemo, useState } from "react";
import { ChevronDown, FileQuestion, SearchCheck } from "lucide-react";
import clsx from "clsx";
import { usePatient } from "@/components/patient/PatientContext";
import { findMissingContext, type ContextGap } from "@/lib/context-engine";
import { reasoningProvider } from "@/lib/reasoning-engine";
import { eventTypeIcon } from "@/components/dashboard/eventMeta";
import { ReasoningDrawer, type DrawerContent } from "@/components/dashboard/ReasoningDrawer";
import { SeverityDot } from "@/components/ui/Severity";
import type { ClinicalEvent } from "@/lib/types";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function UnresolvedContext() {
  const { tickIndex, events, dataset } = usePatient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<DrawerContent | null>(null);

  const gaps = useMemo(
    () => findMissingContext(tickIndex, events, dataset.vitalSeries),
    [tickIndex, events, dataset]
  );

  function openEvent(event: ClinicalEvent) {
    setSelected({
      id: event.id,
      icon: eventTypeIcon[event.type],
      title: event.title,
      typeLabel: "Supporting record",
      timeLabel: formatTime(event.timestamp),
      severity: event.severity,
      description: event.description,
      sourceText: event.sourceText,
      highlight: event.highlight,
      steps: reasoningProvider.explainEvent(event, events),
    });
  }

  function openObservation(gap: ContextGap) {
    if (!gap.observation) return;
    setSelected({
      id: gap.id,
      icon: SearchCheck,
      title: gap.observation.label,
      typeLabel: "Observation",
      severity: gap.severity,
      sourceText: gap.observation.sourceText,
      highlight: gap.observation.highlight,
    });
  }

  return (
    <div className="panel flex h-full flex-col">
      <div className="panel-header shrink-0">
        <div>
          <p className="text-sm font-medium text-ink-primary">Unresolved context</p>
          <p className="text-[11px] text-ink-tertiary">
            What the record does not contain — gaps detected from the data itself, not a diagnosis
          </p>
        </div>
        <span className="tabular text-xs text-ink-tertiary">
          {gaps.length} open {gaps.length === 1 ? "gap" : "gaps"}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {gaps.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-base-400 bg-base-200">
              <SearchCheck className="h-5 w-5 text-signal-normal" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-ink-primary">No open gaps at this point in the record</p>
            <p className="max-w-sm text-sm leading-relaxed text-ink-tertiary">
              Every abnormal reading here has a related follow-up record. Scrub the timeline or ingest a document — gaps open and close as the record changes.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-base-400">
            {gaps.map((gap) => {
              const isOpen = expandedId === gap.id;
              return (
                <li key={gap.id}>
                  <button
                    onClick={() => setExpandedId(isOpen ? null : gap.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors duration-150 ease-product hover:bg-base-200"
                  >
                    <span className="mt-1.5">
                      <SeverityDot level={gap.severity} pulse={gap.severity === "critical"} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-ink-primary">{gap.title}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-ink-tertiary">{gap.description}</span>
                    </span>
                    <ChevronDown
                      className={clsx(
                        "mt-1 h-4 w-4 shrink-0 text-ink-tertiary transition-transform duration-200 ease-product",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {isOpen && (
                    <div className="animate-fade-in space-y-4 border-t border-base-400 bg-base-100/50 px-4 py-4 pl-10">
                      <div>
                        <p className="flex items-center gap-1.5 text-[11px] font-medium text-ink-tertiary">
                          <FileQuestion className="h-3.5 w-3.5" strokeWidth={1.75} />
                          Missing information
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {gap.missing.map((m) => (
                            <li key={m} className="text-sm leading-relaxed text-ink-secondary">
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {gap.observation && (
                          <button
                            onClick={() => openObservation(gap)}
                            className="flex items-center gap-1.5 rounded-full border border-base-400 bg-base-200 px-2.5 py-1 text-xs text-ink-tertiary transition-colors duration-150 ease-product hover:border-base-500 hover:text-ink-primary"
                          >
                            <SearchCheck className="h-3 w-3" strokeWidth={1.75} />
                            {gap.observation.label}
                          </button>
                        )}
                        {gap.evidence.map((e) => {
                          const Icon = eventTypeIcon[e.type];
                          return (
                            <button
                              key={e.id}
                              onClick={() => openEvent(e)}
                              className="flex items-center gap-1.5 rounded-full border border-base-400 bg-base-200 px-2.5 py-1 text-xs text-ink-tertiary transition-colors duration-150 ease-product hover:border-base-500 hover:text-ink-primary"
                            >
                              <Icon className="h-3 w-3" strokeWidth={1.75} />
                              {e.title}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ReasoningDrawer content={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
