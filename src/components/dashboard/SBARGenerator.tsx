"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, FileStack, RotateCcw, Trash2 } from "lucide-react";
import clsx from "clsx";
import { usePatient } from "@/components/patient/PatientContext";
import { useCommandState } from "@/components/dashboard/CommandContext";
import { reasoningProvider } from "@/lib/reasoning-engine";
import { eventTypeIcon } from "@/components/dashboard/eventMeta";
import { Button } from "@/components/ui/Button";
import { ReasoningDrawer, type DrawerContent } from "@/components/dashboard/ReasoningDrawer";
import type { ClinicalEvent, SBARReport } from "@/lib/types";

const CHARS_PER_TICK = 2;
const TICK_MS = 10;
const SECTION_PAUSE_MS = 220;

const sectionPrefix: Record<SBARReport["sections"][number]["id"], string> = {
  situation: "S",
  background: "B",
  assessment: "A",
  recommendation: "R",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function SBARGenerator() {
  const { tickIndex, events } = usePatient();
  const { sbarAutoGenerateToken } = useCommandState();
  const [report, setReport] = useState<SBARReport | null>(null);
  const [status, setStatus] = useState<"idle" | "streaming" | "done">("idle");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState<DrawerContent | null>(null);
  const isFirstAutoGenerate = useRef(true);

  useEffect(() => {
    if (isFirstAutoGenerate.current) {
      isFirstAutoGenerate.current = false;
      return;
    }
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sbarAutoGenerateToken]);

  useEffect(() => {
    if (status !== "streaming" || !report) return;
    const section = report.sections[sectionIndex];
    if (!section) {
      setStatus("done");
      return;
    }
    if (charCount >= section.content.length) {
      const t = setTimeout(() => {
        setSectionIndex((i) => i + 1);
        setCharCount(0);
      }, SECTION_PAUSE_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCharCount((c) => c + CHARS_PER_TICK), TICK_MS);
    return () => clearTimeout(t);
  }, [status, report, sectionIndex, charCount]);

  function generate() {
    setReport(reasoningProvider.generateSBAR(tickIndex, events));
    setSectionIndex(0);
    setCharCount(0);
    setStatus("streaming");
    setCopied(false);
  }

  function clear() {
    setReport(null);
    setStatus("idle");
    setSectionIndex(0);
    setCharCount(0);
    setCopied(false);
  }

  function copyReport() {
    if (!report) return;
    const text = report.sections
      .map((s) => `${sectionPrefix[s.id]} — ${s.label}\n${s.content}`)
      .join("\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  function selectEvidence(event: ClinicalEvent) {
    setSelected({
      id: event.id,
      icon: eventTypeIcon[event.type],
      title: event.title,
      typeLabel: "Supporting evidence",
      timeLabel: formatTime(event.timestamp),
      severity: event.severity,
      sourceText: event.sourceText,
      highlight: event.highlight,
      steps: reasoningProvider.explainEvent(event, events),
    });
  }

  return (
    <div className="panel flex h-full flex-col">
      <div className="panel-header shrink-0">
        <div>
          <p className="text-sm font-medium text-ink-primary">Handoff (SBAR)</p>
          <p className="text-[11px] text-ink-tertiary">
            Generated from current patient state — a demonstration draft, not a clinical document
          </p>
        </div>
        {report && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={copyReport} disabled={status !== "done"}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy report"}
            </Button>
            <Button variant="secondary" size="sm" onClick={generate}>
              <RotateCcw className="h-3.5 w-3.5" />
              Regenerate
            </Button>
            <Button variant="ghost" size="sm" onClick={clear}>
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-5">
        {!report ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-base-400 bg-base-200">
              <FileStack className="h-5 w-5 text-ink-tertiary" strokeWidth={1.5} />
            </div>
            <div className="max-w-sm space-y-1.5">
              <p className="text-sm font-medium text-ink-primary">No handoff generated yet</p>
              <p className="text-sm leading-relaxed text-ink-tertiary">
                Build a Situation–Background–Assessment–Recommendation draft from the patient&apos;s current state.
              </p>
            </div>
            <Button variant="primary" size="md" onClick={generate}>
              Generate handoff
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {report.sections.map((section, i) => {
              const isRevealed = i < sectionIndex || status === "done";
              const isActive = i === sectionIndex && status === "streaming";
              const text = isRevealed ? section.content : isActive ? section.content.slice(0, charCount) : "";

              return (
                <div key={section.id} className={clsx(!isRevealed && !isActive && "opacity-30")}>
                  <div className="flex items-center gap-2.5">
                    <span className="tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-base-400 bg-base-200 text-xs text-ink-secondary">
                      {sectionPrefix[section.id]}
                    </span>
                    <p className="text-sm font-medium text-ink-primary">{section.label}</p>
                  </div>
                  <p className="mt-2 min-h-[1.5em] pl-8 text-sm leading-relaxed text-ink-secondary">
                    {text}
                    {isActive && <span className="inline-block w-1.5 animate-pulse-live bg-synapse-bright">&nbsp;</span>}
                  </p>

                  {isRevealed && section.evidenceEvents.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2 pl-8">
                      {section.evidenceEvents.map((event) => {
                        const Icon = eventTypeIcon[event.type];
                        return (
                          <button
                            key={event.id}
                            onClick={() => selectEvidence(event)}
                            className="flex items-center gap-1.5 rounded-full border border-base-400 bg-base-200 px-2.5 py-1 text-xs text-ink-tertiary transition-colors duration-150 ease-product hover:border-base-500 hover:text-ink-primary"
                          >
                            <Icon className="h-3 w-3" strokeWidth={1.75} />
                            {event.title}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ReasoningDrawer content={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
