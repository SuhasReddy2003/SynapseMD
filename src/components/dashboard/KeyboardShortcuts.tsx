"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useCommandState } from "@/components/dashboard/CommandContext";
import { dashboardSections } from "@/lib/navigation";

const rows: { keys: string; label: string }[] = [
  { keys: "⌘K / Ctrl+K", label: "Open the command palette" },
  { keys: `1 – ${dashboardSections.length}`, label: "Jump straight to a section" },
  { keys: "Esc", label: "Close whatever panel is open" },
  { keys: "?", label: "Show this list" },
];

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
}

export function KeyboardShortcuts() {
  const { setActiveSection } = useCommandState();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;

      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen((open) => !open);
        return;
      }

      const index = Number(e.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < dashboardSections.length) {
        setActiveSection(dashboardSections[index]!.id);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setActiveSection]);

  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setHelpOpen(false);
    }
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  if (!helpOpen) return null;

  return (
    <>
      <div onClick={() => setHelpOpen(false)} className="fixed inset-0 z-[60] bg-black/60" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className="animate-fade-in fixed left-1/2 top-1/2 z-[70] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 px-4"
      >
        <div className="panel overflow-hidden shadow-floating">
          <div className="panel-header">
            <p className="text-sm font-medium text-ink-primary">Keyboard shortcuts</p>
            <button
              onClick={() => setHelpOpen(false)}
              aria-label="Close"
              className="flex h-7 w-7 items-center justify-center rounded-md text-ink-tertiary hover:bg-base-200 hover:text-ink-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-base-400">
            {rows.map((r) => (
              <div key={r.keys} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-ink-secondary">{r.label}</span>
                <kbd className="tabular rounded border border-base-400 bg-base-200 px-1.5 py-0.5 text-xs text-ink-tertiary">
                  {r.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
