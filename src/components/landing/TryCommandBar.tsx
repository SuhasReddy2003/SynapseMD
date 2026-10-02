"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Command } from "lucide-react";
import { matchCommands } from "@/lib/commands";

const EXAMPLES = ["show potassium", "what changed today", "generate handoff", "show unresolved signals"];

export function TryCommandBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function go() {
    const match = matchCommands(query)[0];
    router.push(match ? `/dashboard?cmd=${match.id}` : "/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-2.5 rounded-lg border border-base-400 bg-base-200 px-4 py-3 transition-colors duration-150 ease-product focus-within:border-synapse">
        <Command className="h-4 w-4 shrink-0 text-ink-tertiary" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder='Try a real command — "show potassium", "what changed today"…'
          className="w-full bg-transparent text-sm text-ink-primary outline-none placeholder:text-ink-faint"
        />
        <button
          onClick={go}
          aria-label="Run command"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-tertiary transition-colors duration-150 ease-product hover:bg-base-300 hover:text-ink-primary"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => setQuery(ex)}
            className="rounded-full border border-base-400 px-2.5 py-1 text-xs text-ink-tertiary transition-colors duration-150 ease-product hover:border-base-500 hover:text-ink-secondary"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
