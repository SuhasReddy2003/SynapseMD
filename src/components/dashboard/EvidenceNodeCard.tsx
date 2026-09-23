"use client";

import { Handle, Position } from "reactflow";
import clsx from "clsx";
import { SeverityDot } from "@/components/ui/Severity";
import { evidenceNodeIcon } from "@/components/dashboard/evidenceMeta";
import type { EvidenceNode } from "@/lib/evidence-engine";

export interface EvidenceFlowNodeData {
  node: EvidenceNode;
  onSelect: (node: EvidenceNode) => void;
}

const severityBorder: Record<string, string> = {
  normal: "border-signal-normal/40",
  warning: "border-signal-warning/50",
  critical: "border-signal-critical/60",
  neutral: "border-base-400",
};

export function EvidenceNodeCard({ data }: { data: EvidenceFlowNodeData }) {
  const { node, onSelect } = data;
  const Icon = evidenceNodeIcon(node);
  const isSignal = node.kind === "signal";

  return (
    <button
      onClick={() => onSelect(node)}
      className={clsx(
        "w-[230px] rounded-lg border bg-base-200 px-3.5 py-3 text-left shadow-panel transition-colors duration-150 ease-product hover:bg-base-300",
        severityBorder[node.severity],
        isSignal && "bg-base-300"
      )}
    >
      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <Handle type="source" position={Position.Right} className="!opacity-0" />

      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-base-400 bg-base-100">
          <Icon className="h-3.5 w-3.5 text-ink-secondary" strokeWidth={1.75} />
        </span>
        <SeverityDot level={node.severity} pulse={node.severity === "critical"} />
        <span className="text-[11px] text-ink-tertiary">{node.sublabel}</span>
      </div>
      <p
        className={clsx(
          "mt-2 leading-snug text-ink-primary",
          isSignal ? "text-sm font-medium" : "text-sm"
        )}
      >
        {node.label}
      </p>
    </button>
  );
}
