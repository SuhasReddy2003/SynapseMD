"use client";

import clsx from "clsx";
import Link from "next/link";
import { dashboardSections, type SectionId } from "@/lib/navigation";

export function Sidebar({
  active,
  onSelect,
}: {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-base-400 bg-base-100">
      <div className="flex h-14 items-center border-b border-base-400 px-5">
        <Link href="/" className="text-sm font-semibold tracking-tight text-ink-primary">
          SynapseMD
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {dashboardSections.map((section) => {
          const isActive = section.id === active;
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => onSelect(section.id)}
              aria-current={isActive ? "page" : undefined}
              className={clsx(
                "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors duration-150 ease-product",
                isActive
                  ? "bg-base-300 text-ink-primary"
                  : "text-ink-secondary hover:bg-base-200 hover:text-ink-primary"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {section.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-base-400 px-5 py-4">
        <p className="text-[11px] leading-relaxed text-ink-faint">
          Synthetic data · Research prototype · Not for clinical
          decision-making
        </p>
      </div>
    </aside>
  );
}
