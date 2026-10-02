"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play } from "lucide-react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { usePatient } from "@/components/patient/PatientContext";
import { buildEvidenceGraph, replayOrder, type EvidenceNode } from "@/lib/evidence-engine";
import { useCommandState } from "@/components/dashboard/CommandContext";
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
  const { tickIndex, events, dataset } = usePatient();
  const { evidenceReplayToken } = useCommandState();
  const [selected, setSelected] = useState<DrawerContent | null>(null);
  /** null = not replaying (everything shown); otherwise the evidence written so far, in order. */
  const [revealed, setRevealed] = useState<string[] | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const initialToken = useRef(evidenceReplayToken);

  const graph = useMemo(
    () => buildEvidenceGraph(tickIndex, events, dataset.vitalSeries, dataset.patient),
    [tickIndex, events, dataset]
  );

  function stopReplay() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function startReplay() {
    stopReplay();
    const order = replayOrder(graph);
    setRevealed([]);
    order.forEach((node, i) => {
      timers.current.push(setTimeout(() => setRevealed(order.slice(0, i + 1).map((n) => n.id)), 600 + i * 750));
    });
    timers.current.push(setTimeout(() => setRevealed(null), 600 + order.length * 750 + 1400));
  }

  // A command (or the guided tour) can ask for a replay; the token changing is the request.
  useEffect(() => {
    if (evidenceReplayToken === initialToken.current) return;
    initialToken.current = evidenceReplayToken;
    startReplay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evidenceReplayToken]);

  useEffect(() => stopReplay, []);
  useEffect(() => {
    stopReplay();
    setRevealed(null);
  }, [dataset.patient.id]);

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
        data: {
          node: child,
          onSelect: selectNode,
          hidden: revealed !== null && !revealed.includes(child.id),
          fresh: revealed !== null && revealed[revealed.length - 1] === child.id,
        },
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
        style: {
          stroke: colors.base[500],
          opacity: revealed !== null && !revealed.includes(e.target) ? 0 : 1,
          transition: "opacity 600ms",
        },
        labelStyle: { fill: colors.ink.tertiary, fontSize: 11 },
        labelBgStyle: { fill: colors.base[100] },
        animated: revealed !== null ? revealed[revealed.length - 1] === e.target : target.severity === "critical",
      };
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [graph, revealed]);

  return (
    <div className="panel flex h-full flex-col">
      <div className="panel-header shrink-0">
        <div>
          <p className="text-sm font-medium text-ink-primary">Evidence graph</p>
          <p className="text-[11px] text-ink-tertiary">
            Relationships behind the current {evidenceKindLabel.signal.toLowerCase()} — click a node for its source record
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-ink-tertiary">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: severityColor[graph.nodes[0]!.severity] }}
            />
            {graph.focusVital}
          </span>
          <button
            onClick={startReplay}
            disabled={revealed !== null}
            className="flex items-center gap-1.5 rounded-full border border-base-400 bg-base-200 px-2.5 py-1 text-xs text-ink-secondary transition-colors duration-150 ease-product hover:border-base-500 hover:text-ink-primary disabled:cursor-default disabled:opacity-60"
          >
            <Play className="h-3 w-3" strokeWidth={2} />
            {revealed !== null ? "Replaying…" : "Replay reasoning"}
          </button>
        </div>
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
