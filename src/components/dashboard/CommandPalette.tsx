"use client";

import { useEffect, useRef, useState } from "react";
import { CornerDownLeft, Search } from "lucide-react";
import clsx from "clsx";
import { useCommandState } from "@/components/dashboard/CommandContext";
import { matchCommands } from "@/lib/commands";

export function CommandPalette() {
  const state = useCommandState();
  const { paletteOpen, setPaletteOpen } = state;
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = matchCommands(query);

  // Global Cmd+K / Ctrl+K launcher.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      } else if (e.key === "Escape") {
        setPaletteOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setPaletteOpen]);

  useEffect(() => {
    if (paletteOpen) {
      setQuery("");
      setHighlighted(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [paletteOpen]);

  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  function runCommand(index: number) {
    const command = results[index];
    if (!command) return;
    command.run(state);
    setPaletteOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runCommand(highlighted);
    }
  }

  if (!paletteOpen) return null;

  return (
    <>
      <div
        onClick={() => setPaletteOpen(false)}
        className="fixed inset-0 z-[60] bg-black/60"
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="animate-fade-in fixed inset-x-0 top-24 z-[70] mx-auto w-full max-w-xl px-4"
      >
        <div className="panel overflow-hidden shadow-floating">
          <div className="flex items-center gap-2.5 border-b border-base-400 px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-ink-tertiary" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Try “show potassium” or “what changed today”…"
              className="w-full bg-transparent text-sm text-ink-primary outline-none placeholder:text-ink-faint"
            />
            <kbd className="tabular rounded border border-base-400 px-1.5 py-0.5 text-[10px] text-ink-tertiary">
              esc
            </kbd>
          </div>

          <ul className="max-h-80 overflow-auto py-1.5">
            {results.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-ink-tertiary">No matching commands.</li>
            )}
            {results.map((command, i) => (
              <li key={command.id}>
                <button
                  onClick={() => runCommand(i)}
                  onMouseEnter={() => setHighlighted(i)}
                  className={clsx(
                    "flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left transition-colors duration-100 ease-product",
                    i === highlighted ? "bg-base-300" : "hover:bg-base-200"
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-sm text-ink-primary">{command.label}</p>
                    <p className="truncate text-xs text-ink-tertiary">{command.hint}</p>
                  </div>
                  {i === highlighted && (
                    <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-ink-tertiary" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
