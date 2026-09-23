"use client";

import { useMemo, useState } from "react";
import { CircleCheck, CircleX, Minus, TrendingDown, TrendingUp } from "lucide-react";
import clsx from "clsx";
import { usePatient } from "@/components/patient/PatientContext";
import { buildClinicalDelta, eventsUpTo } from "@/lib/clinical-engine";
import { clinicalEvents, vitalSeries } from "@/lib/mock-data";
import { eventTypeIcon } from "@/components/dashboard/eventMeta";
import { reasoningProvider } from "@/lib/reasoning-engine";
import { SeverityDot } from "@/components/ui/Severity";
import { ReasoningDrawer, type DrawerContent } from "@/components/dashboard/ReasoningDrawer";
import type { MedicationDeltaEntry, VitalDeltaEntry } from "@/lib/types";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function TimeSelect({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (index: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-ink-tertiary">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="tabular rounded-md border border-base-400 bg-base-200 px-2 py-1.5 text-xs text-ink-primary outline-none transition-colors duration-150 ease-product hover:border-base-500 focus-visible:border-synapse"
      >
        {Array.from({ length: max + 1 }, (_, i) => i).map((i) => (
          <option key={i} value={i}>
            {formatTime(vitalSeries.heartRate[i]!.timestamp)}
          </option>
        ))}
      </select>
    </label>
  );
}

function VitalDeltaRow({ entry, onSelect }: { entry: VitalDeltaEntry; onSelect: () => void }) {
  const diff = Number((entry.toValue - entry.fromValue).toFixed(entry.decimals));
  const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;

  return (
    <button
      onClick={onSelect}
      className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors duration-150 ease-product hover:bg-base-200"
    >
      <span className="w-28 shrink-0 text-sm text-ink-primary">{entry.label}</span>
      <span className="tabular flex items-center gap-1.5 text-sm text-ink-secondary">
        <SeverityDot level={entry.fromSeverity} />
        {entry.fromValue.toFixed(entry.decimals)}
      </span>
      <Icon
        className={clsx(
          "h-3.5 w-3.5 shrink-0",
          entry.changed ? "text-synapse-bright" : "text-ink-faint"
        )}
      />
      <span className="tabular flex items-center gap-1.5 text-sm text-ink-primary">
        <SeverityDot level={entry.toSeverity} />
        {entry.toValue.toFixed(entry.decimals)} {entry.unit}
      </span>
      {entry.changed && (
        <span className="tabular ml-auto text-xs text-ink-tertiary">
          {diff > 0 ? "+" : ""}
          {diff}
        </span>
      )}
    </button>
  );
}

function MedicationDeltaRow({ entry, onSelect }: { entry: MedicationDeltaEntry; onSelect: () => void }) {
  const changed = entry.fromPresent !== entry.toPresent;
  return (
    <button
      onClick={onSelect}
      className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors duration-150 ease-product hover:bg-base-200"
    >
      <span className="min-w-0 flex-1 truncate text-sm text-ink-primary">{entry.label}</span>
      <span className="flex items-center gap-1.5 text-xs text-ink-tertiary">
        {entry.fromPresent ? (
          <CircleCheck className="h-3.5 w-3.5 text-signal-normal" />
        ) : (
          <CircleX className="h-3.5 w-3.5 text-ink-faint" />
        )}
        {entry.fromPresent ? "administered" : "absent"}
      </span>
      <span className={clsx("text-xs", changed ? "text-synapse-bright" : "text-ink-faint")}>→</span>
      <span className="flex items-center gap-1.5 text-xs text-ink-tertiary">
        {entry.toPresent ? (
          <CircleCheck className="h-3.5 w-3.5 text-signal-normal" />
        ) : (
          <CircleX className="h-3.5 w-3.5 text-ink-faint" />
        )}
        {entry.toPresent ? "administered" : "absent"}
      </span>
    </button>
  );
}

export function ClinicalDelta() {
  const { tickIndex } = usePatient();
  const [fromIndex, setFromIndex] = useState(() => Math.max(0, tickIndex - 8));
  const [toIndex, setToIndex] = useState(tickIndex);
  const [selected, setSelected] = useState<DrawerContent | null>(null);

  const delta = useMemo(() => buildClinicalDelta(fromIndex, toIndex), [fromIndex, toIndex]);

  function selectVital(entry: VitalDeltaEntry) {
    setSelected({
      id: `vital-${entry.kind}`,
      icon: entry.toValue >= entry.fromValue ? TrendingUp : TrendingDown,
      title: entry.label,
      typeLabel: "Observation change",
      timeLabel: `${formatTime(delta.fromTimestamp)} → ${formatTime(delta.toTimestamp)}`,
      severity: entry.toSeverity,
      sourceText: `Monitor readings: ${entry.label} moved from ${entry.fromValue.toFixed(entry.decimals)} ${entry.unit} at ${formatTime(delta.fromTimestamp)} to ${entry.toValue.toFixed(entry.decimals)} ${entry.unit} at ${formatTime(delta.toTimestamp)}.`,
      highlight: `${entry.toValue.toFixed(entry.decimals)} ${entry.unit}`,
    });
  }

  function selectMedication(entry: MedicationDeltaEntry) {
    const event = clinicalEvents.find((e) => e.id === entry.eventId);
    if (!event) return;
    setSelected({
      id: event.id,
      icon: eventTypeIcon[event.type],
      title: event.title,
      typeLabel: "Medication change",
      timeLabel: formatTime(event.timestamp),
      severity: event.severity,
      sourceText: event.sourceText,
      highlight: event.highlight,
      steps: reasoningProvider.explainEvent(event, eventsUpTo(toIndex)),
    });
  }

  return (
    <div className="panel flex h-full flex-col">
      <div className="panel-header shrink-0">
        <div>
          <p className="text-sm font-medium text-ink-primary">What changed</p>
          <p className="text-[11px] text-ink-tertiary">Compare two points in the revealed record</p>
        </div>
        <div className="flex items-center gap-3">
          <TimeSelect label="From" value={fromIndex} max={tickIndex} onChange={setFromIndex} />
          <TimeSelect label="To" value={toIndex} max={tickIndex} onChange={setToIndex} />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="border-b border-base-400 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-ink-tertiary">
          Vitals
        </div>
        <div className="divide-y divide-base-400">
          {delta.vitals.map((entry) => (
            <VitalDeltaRow key={entry.kind} entry={entry} onSelect={() => selectVital(entry)} />
          ))}
        </div>

        {delta.medications.length > 0 && (
          <>
            <div className="border-y border-base-400 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-ink-tertiary">
              Medications
            </div>
            <div className="divide-y divide-base-400">
              {delta.medications.map((entry) => (
                <MedicationDeltaRow key={entry.eventId} entry={entry} onSelect={() => selectMedication(entry)} />
              ))}
            </div>
          </>
        )}

        <div className="border-y border-base-400 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-ink-tertiary">
          Encounter activity
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <span className="w-28 shrink-0 text-sm text-ink-primary">Recorded events</span>
          <span className="tabular text-sm text-ink-secondary">{delta.eventCountFrom}</span>
          <TrendingUp
            className={clsx(
              "h-3.5 w-3.5",
              delta.eventCountTo > delta.eventCountFrom ? "text-synapse-bright" : "text-ink-faint"
            )}
          />
          <span className="tabular text-sm text-ink-primary">{delta.eventCountTo} events</span>
        </div>
      </div>

      <ReasoningDrawer content={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
