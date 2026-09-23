"use client";

import { useMemo, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { usePatient } from "@/components/patient/PatientContext";
import { buildEvidenceGraph, type EvidenceNode } from "@/lib/evidence-engine";
import { reasoningProvider } from "@/lib/reasoning-engine";
import { colors, severityColor } from "@/lib/design-tokens";
import { evidenceKindLabel, evidenceNodeIcon } from "@/components/dashboard/evidenceMeta";
import { ReasoningDrawer, type DrawerContent } from "@/components/dashboard/ReasoningDrawer";
import { EvidenceNodeCard, type EvidenceFlowNodeData } from "@/components/dashboard/EvidenceNodeCard";

const nodeTypes = { evidence: EvidenceNodeCard };

const CHILD_X = 420;
const CHILD_SPACING_Y = 116;

function iconAndLabel(node: EvidenceNode) {
  return {
    icon: evidenceNodeIcon(node),
    typeLabel: evidenceKindLabel[node.kind],
  };
}

export function EvidenceGraph() {
  const { tickIndex, events } = usePatient();
  const [selected, setSelected] = useState<DrawerContent | null>(null);

  const graph = useMemo(() => buildEvidenceGraph(tickIndex, events), [tickIndex, events]);

  function selectNode(node: EvidenceNode) {
    const { icon, typeLabel } = iconAndLabel(node);
    setSelected({
      id: node.id,
      icon,
      title: node.label,
      typeLabel,
      timeLabel: node.sublabel,
      severity: node.severity,
      sourceText: node.sourceText,
      highlight: node.highlight,
      steps: node.linkedEvent ? reasoningProvider.explainEvent(node.linkedEvent, events) : undefined,
    });
  }

  const { nodes, edges }: { nodes: Node<EvidenceFlowNodeData>[]; edges: Edge[] } = useMemo(() => {
    const children = graph.nodes.filter((n) => n.id !== "signal");
    const signal = graph.nodes.find((n) => n.id === "signal")!;
    const centerY = ((children.length - 1) * CHILD_SPACING_Y) / 2;

    const flowNodes: Node<EvidenceFlowNodeData>[] = [
      {
        id: signal.id,
        type: "evidence",
        position: { x: 20, y: centerY },
        data: { node: signal, onSelect: selectNode },
        draggable: true,
      },
      ...children.map((child, i) => ({
        id: child.id,
        type: "evidence",
        position: { x: CHILD_X, y: i * CHILD_SPACING_Y },
        data: { node: child, onSelect: selectNode },
        draggable: true,
      })),
    ];

    const flowEdges: Edge[] = graph.edges.map((e) => {
      const target = graph.nodes.find((n) => n.id === e.target)!;
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: "smoothstep",
        style: { stroke: colors.base[500] },
        labelStyle: { fill: colors.ink.tertiary, fontSize: 11 },
        labelBgStyle: { fill: colors.base[100] },
        animated: target.severity === "critical",
      };
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [graph]);

  return (
    <div className="panel flex h-full flex-col">
      <div className="panel-header shrink-0">
        <div>
          <p className="text-sm font-medium text-ink-primary">Evidence graph</p>
          <p className="text-[11px] text-ink-tertiary">
            Relationships behind the current {evidenceKindLabel.signal.toLowerCase()} — click a node for its source record
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-ink-tertiary">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: severityColor[graph.nodes[0]!.severity] }}
          />
          {graph.focusVital}
        </span>
      </div>

      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.5}
          maxZoom={1.5}
          className="!bg-transparent"
        >
          <Background variant={BackgroundVariant.Dots} color={colors.base[400]} gap={20} size={1} />
          <Controls showInteractive={false} className="!bg-base-200 !border-base-400 !shadow-panel [&>button]:!border-base-400 [&>button]:!bg-base-200 [&>button]:!fill-ink-secondary [&>button]:hover:!bg-base-300" />
        </ReactFlow>
      </div>

      <ReasoningDrawer content={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
