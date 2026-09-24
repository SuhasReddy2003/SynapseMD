"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileText, Loader2, UploadCloud } from "lucide-react";
import clsx from "clsx";
import { usePatient } from "@/components/patient/PatientContext";
import { buildIngestedEvent, ingestionStageLabels } from "@/lib/ingestion-engine";
import { eventTypeDisplayLabel, eventTypeIcon } from "@/components/dashboard/eventMeta";
import { SeverityDot } from "@/components/ui/Severity";
import { Button } from "@/components/ui/Button";
import type { ClinicalEvent } from "@/lib/types";

const ACCEPTED_EXTENSIONS = [".raw", ".xml", ".txt", ".json"];
const STAGE_DELAY_MS = 450;

const stageDetail: Record<number, (fileName: string) => string> = {
  0: (name) => `Reading ${name}`,
  1: () => "Identified clinical entities in the document",
  2: () => "Mapped extracted terms to standard clinical vocabulary",
  3: () => "Sequenced the new record against existing patient events",
  4: () => "Relationships added to the evidence graph",
  5: () => "Finalizing ingestion",
};

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function IngestionPanel() {
  const { events, ingestedCount, addIngestedEvent, dataset } = usePatient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [stageIndex, setStageIndex] = useState(-1);
  const [status, setStatus] = useState<"idle" | "running" | "done">("idle");
  const [lastAdded, setLastAdded] = useState<ClinicalEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "running") return;
    const isLastStage = stageIndex >= ingestionStageLabels.length - 1;
    const timer = setTimeout(() => {
      if (isLastStage) {
        const event = buildIngestedEvent(ingestedCount, dataset.patient.id, dataset.vitalSeries);
        addIngestedEvent(event);
        setLastAdded(event);
        setStatus("done");
      } else {
        setStageIndex((i) => i + 1);
      }
    }, STAGE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, stageIndex]);

  function beginIngestion(file: File) {
    const ext = extensionOf(file.name);
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported format "${ext || "unknown"}" — try ${ACCEPTED_EXTENSIONS.join(", ")}.`);
      return;
    }
    setError(null);
    setFileName(file.name);
    setStageIndex(0);
    setStatus("running");
  }

  function reset() {
    setStatus("idle");
    setStageIndex(-1);
    setFileName(null);
    setLastAdded(null);
    setError(null);
  }

  const ingestedHistory = events.filter((e) => e.id.startsWith("ingested-"));

  return (
    <div className="panel flex h-full flex-col">
      <div className="panel-header shrink-0">
        <div>
          <p className="text-sm font-medium text-ink-primary">EHR ingestion</p>
          <p className="text-[11px] text-ink-tertiary">
            Drop a synthetic record to add it to the patient&apos;s event store
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5">
        {status === "idle" && (
          <div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) beginIngestion(file);
              }}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
              }}
              className={clsx(
                "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center transition-colors duration-150 ease-product",
                isDragging
                  ? "border-synapse bg-synapse-dim/40"
                  : "border-base-400 hover:border-base-500 hover:bg-base-200"
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS.join(",")}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) beginIngestion(file);
                  e.target.value = "";
                }}
              />
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-base-400 bg-base-200">
                <UploadCloud className="h-5 w-5 text-ink-tertiary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-ink-primary">Drag a record here, or click to browse</p>
                <p className="mt-1 text-xs text-ink-tertiary">Accepts .raw · .xml · .txt · .json</p>
              </div>
            </div>

            {error && <p className="mt-3 text-xs text-signal-critical">{error}</p>}
          </div>
        )}

        {status === "running" && (
          <div className="panel p-5">
            <div className="flex items-center gap-2.5 text-sm text-ink-primary">
              <FileText className="h-4 w-4 text-ink-tertiary" strokeWidth={1.75} />
              {fileName}
            </div>
            <ol className="mt-4 space-y-2.5">
              {ingestionStageLabels.slice(0, stageIndex + 1).map((label, i) => {
                const isActive = i === stageIndex;
                return (
                  <li key={label} className="animate-fade-in flex items-start gap-2.5">
                    {isActive ? (
                      <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-synapse-bright" />
                    ) : (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal-normal" />
                    )}
                    <div>
                      <p className="tabular text-sm text-ink-primary">{label.toUpperCase()}</p>
                      <p className="text-xs text-ink-tertiary">{stageDetail[i]?.(fileName ?? "record")}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {status === "done" && lastAdded && (
          <div className="panel animate-fade-in p-5">
            <div className="flex items-center gap-2.5 text-signal-normal">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm font-medium text-ink-primary">Ingestion complete</p>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-md border border-base-400 bg-base-200 px-3.5 py-3">
              {(() => {
                const Icon = eventTypeIcon[lastAdded.type];
                return (
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-base-400 bg-base-100">
                    <Icon className="h-3.5 w-3.5 text-ink-secondary" strokeWidth={1.75} />
                  </span>
                );
              })()}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-ink-primary">{lastAdded.title}</p>
                  <SeverityDot level={lastAdded.severity} />
                </div>
                <p className="mt-0.5 text-xs text-ink-tertiary">
                  {eventTypeDisplayLabel[lastAdded.type]} · {formatTime(lastAdded.timestamp)} · added to timeline
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="secondary" size="sm" onClick={reset}>
                Ingest another file
              </Button>
            </div>
          </div>
        )}

        {ingestedHistory.length > 0 && status === "idle" && (
          <div className="mt-6">
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-tertiary">
              Ingested this session
            </p>
            <div className="mt-2 divide-y divide-base-400 rounded-lg border border-base-400">
              {ingestedHistory.map((e) => {
                const Icon = eventTypeIcon[e.type];
                return (
                  <div key={e.id} className="flex items-center gap-3 px-3.5 py-2.5">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-ink-tertiary" strokeWidth={1.75} />
                    <span className="min-w-0 flex-1 truncate text-sm text-ink-secondary">{e.title}</span>
                    <span className="tabular text-xs text-ink-faint">{formatTime(e.timestamp)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
