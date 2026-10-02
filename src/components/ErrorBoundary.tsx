"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In a real deployment this would report to an error-tracking service.
    console.error("SynapseMD render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-base-50 px-6">
          <div className="panel max-w-md p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-base-400 bg-base-200">
              <AlertTriangle className="h-5 w-5 text-signal-critical" strokeWidth={1.5} />
            </div>
            <p className="mt-4 text-sm font-medium text-ink-primary">Something went wrong</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-tertiary">
              This demo hit an unexpected error rendering that view. Reloading usually clears it —
              your patient data is all synthetic and regenerates from scratch either way.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex h-9 items-center justify-center rounded-md bg-ink-primary px-4 text-sm font-medium text-base-50 transition-colors duration-150 ease-product hover:bg-white"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
