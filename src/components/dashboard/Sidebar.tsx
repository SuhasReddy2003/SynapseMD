"use client";

import clsx from "clsx";
import Link from "next/link";
import { X } from "lucide-react";
import { dashboardSections } from "@/lib/navigation";
import { useCommandState } from "@/components/dashboard/CommandContext";

export function Sidebar() {
  const {
    activeSection,
    setActiveSection,
    setSignalsOnly,
    setFocusVital,
    sidebarOpen,
    setSidebarOpen,
  } = useCommandState();

  function selectSection(id: (typeof dashboardSections)[number]["id"]) {
    setActiveSection(id);
    setSignalsOnly(false);
    setFocusVital(null);
    setSidebarOpen(false);
  }

  return (
    <>
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-base-400 bg-base-100 transition-transform duration-300 ease-product lg:static lg:z-auto lg:w-60 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-base-400 px-5">
          <Link href="/" className="text-sm font-semibold tracking-tight text-ink-primary">
            SynapseMD
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
            className="flex h-7 w-7 items-center justify-center rounded-md text-ink-tertiary hover:bg-base-200 hover:text-ink-primary lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {dashboardSections.map((section) => {
            const isActive = section.id === activeSection;
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => selectSection(section.id)}
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
    </>
  );
}
