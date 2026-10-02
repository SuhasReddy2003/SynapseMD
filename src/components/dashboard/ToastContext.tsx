"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import clsx from "clsx";

interface Toast {
  id: number;
  message: string;
  tone: "info" | "success" | "critical";
}

interface ToastContextValue {
  showToast: (message: string, tone?: Toast["tone"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;
const TOAST_DURATION_MS = 3200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, tone: Toast["tone"] = "info") => {
    const id = nextId++;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  function dismiss(id: number) {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[80] flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => {
          const Icon = toast.tone === "success" ? CheckCircle2 : toast.tone === "critical" ? AlertTriangle : Info;
          return (
            <div
              key={toast.id}
              role="status"
              className={clsx(
                "animate-fade-in panel pointer-events-auto relative flex items-center gap-2.5 overflow-hidden px-4 py-2.5 shadow-floating",
                toast.tone === "critical" && "border-signal-critical/40"
              )}
            >
              {toast.tone === "critical" && (
                <span className="absolute inset-x-0 top-0 h-0.5 origin-left animate-sweep bg-signal-critical" />
              )}
              <Icon
                className={clsx(
                  "h-4 w-4 shrink-0",
                  toast.tone === "success"
                    ? "text-signal-normal"
                    : toast.tone === "critical"
                      ? "text-signal-critical"
                      : "text-synapse-bright"
                )}
              />
              <p className="text-sm text-ink-primary">{toast.message}</p>
              <button
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded text-ink-tertiary hover:text-ink-primary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
