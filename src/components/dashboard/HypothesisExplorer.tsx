"use client";

import { useState } from "react";
import { ChevronDown, CircleCheck, CircleHelp, CircleX, Clock3 } from "lucide-react";
import clsx from "clsx";
import { usePatient } from "@/components/patient/PatientContext";
import { reasoningProvider } from "@/lib/reasoning-engine";
import { colors } from "@/lib/design-tokens";

function EvidenceList({
  icon: Icon,
  label,
  items,
  emptyLabel,
}: {
  icon: typeof CircleCheck;
  label: string;
  items: string[];
  emptyLabel: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-tertiary">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        {label}
      </div>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed text-ink-secondary">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-ink-faint">{emptyLabel}</p>
      )}
    </div>
  );
}

export function HypothesisExplorer() {
  const { tickIndex, events } = usePatient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const hypotheses = reasoningProvider.generateHypotheses(tickIndex, events);

  return (
    <div className="panel flex h-full flex-col">
      <div className="panel-header shrink-0">
        <div>
          <p className="text-sm font-medium text-ink-primary">Clinical Hypothesis Explorer</p>
          <p className="text-[11px] text-ink-tertiary">
            Ranked, record-level explanations for the current signal — not a diagnosis
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5">
        <div className="relative space-y-3 border-l border-base-400 pl-6">
          {hypotheses.map((h) => {
            const isExpanded = expandedId === h.id;
            const isWeak = h.confidence < 15;

            return (
              <div key={h.id} className="relative">
                <span
                  className="absolute -left-[29px] top-4 h-2 w-2 rounded-full border-2 border-base-100"
                  style={{ background: isWeak ? colors.base[500] : colors.synapse.DEFAULT }}
                />

                <div
                  className={clsx(
                    "panel overflow-hidden transition-opacity duration-500 ease-product",
                    isWeak && "opacity-60"
                  )}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : h.id)}
                    className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors duration-150 ease-product hover:bg-base-200"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-ink-primary">{h.title}</p>
                        <span className="tabular text-xs text-ink-tertiary">
                          {h.confidence}% synthetic confidence
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-base-300">
                        <div
                          className="h-full rounded-full transition-all duration-[1200ms] ease-product"
                          style={{ width: `${h.confidence}%`, background: colors.synapse.DEFAULT }}
                        />
                      </div>
                    </div>
                    <ChevronDown
                      className={clsx(
                        "h-4 w-4 shrink-0 text-ink-tertiary transition-transform duration-200 ease-product",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </button>

                  {isExpanded && (
                    <div className="animate-fade-in grid grid-cols-1 gap-5 border-t border-base-400 px-4 py-4 sm:grid-cols-2">
                      <EvidenceList
                        icon={CircleCheck}
                        label="Supporting evidence"
                        items={h.supportingEvidence}
                        emptyLabel="None recorded in this window."
                      />
                      <EvidenceList
                        icon={CircleX}
                        label="Contradicting evidence"
                        items={h.contradictingEvidence}
                        emptyLabel="None recorded in this window."
                      />
                      <EvidenceList
                        icon={CircleHelp}
                        label="Missing information"
                        items={h.missingInformation}
                        emptyLabel="Nothing flagged as missing."
                      />
                      <EvidenceList
                        icon={Clock3}
                        label="Temporal relationships"
                        items={h.temporalRelationships}
                        emptyLabel="No timing relationship established."
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
