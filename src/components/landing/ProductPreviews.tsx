import { eventTypeIcon } from "@/components/dashboard/eventMeta";
import { colors, severityColor, severityDimColor } from "@/lib/design-tokens";
import { computeSynapseIndex, eventsUpTo, latestObservation, severityForVital } from "@/lib/clinical-engine";
import { worstVitalKind } from "@/lib/evidence-engine";
import { vitalDefinitions } from "@/lib/mock-data";
import type { EvidenceGraph } from "@/lib/evidence-engine";
import type { ClinicalHypothesis, PatientDataset } from "@/lib/types";
import type { ClinicalEvent } from "@/lib/types";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function EvidencePreview({ graph }: { graph: EvidenceGraph }) {
  const [signal, ...children] = graph.nodes;
  if (!signal) return null;
  const shown = children.slice(0, 4);
  const height = Math.max(shown.length * 44, 140);
  const centerY = height / 2;

  return (
    <div className="panel flex h-full flex-col">
      <div className="panel-header">
        <p className="text-sm font-medium text-ink-primary">Evidence graph</p>
      </div>
      <div className="flex-1 p-4">
        <svg viewBox={`0 0 300 ${height}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
          {shown.map((node, i) => {
            const y = 22 + i * 44;
            return (
              <line
                key={node.id}
                x1={70}
                y1={centerY}
                x2={190}
                y2={y}
                stroke={colors.base[500]}
                strokeWidth={1}
              />
            );
          })}

          <circle cx={40} cy={centerY} r={26} fill={severityDimColor[signal.severity]} stroke={severityColor[signal.severity]} strokeWidth={1.5} />
          <text x={40} y={centerY + 4} textAnchor="middle" fontSize="9" fill={severityColor[signal.severity]} fontWeight={600}>
            signal
          </text>

          {shown.map((node, i) => {
            const y = 22 + i * 44;
            return (
              <g key={node.id}>
                <rect x={190} y={y - 12} width={100} height={24} rx={5} fill={colors.base[200]} stroke={colors.base[400]} />
                <text x={200} y={y + 4} fontSize="9" fill={colors.ink.secondary}>
                  {node.label.length > 16 ? `${node.label.slice(0, 15)}…` : node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function HypothesisPreview({ hypotheses }: { hypotheses: ClinicalHypothesis[] }) {
  const top = hypotheses.slice(0, 3);
  return (
    <div className="panel flex h-full flex-col">
      <div className="panel-header">
        <p className="text-sm font-medium text-ink-primary">Hypothesis explorer</p>
      </div>
      <div className="flex-1 space-y-4 p-4">
        {top.map((h) => (
          <div key={h.id}>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-ink-secondary">{h.title}</span>
              <span className="tabular text-ink-tertiary">{h.confidence}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-base-300">
              <div
                className="h-full rounded-full"
                style={{ width: `${h.confidence}%`, background: colors.synapse.DEFAULT }}
              />
            </div>
          </div>
        ))}
        <p className="pt-1 text-[11px] leading-relaxed text-ink-faint">
          Synthetic confidence — a demonstration, not a diagnosis.
        </p>
      </div>
    </div>
  );
}

export function TimelinePreview({ events }: { events: ClinicalEvent[] }) {
  const shown = events.slice(-4);
  return (
    <div className="panel flex h-full flex-col">
      <div className="panel-header">
        <p className="text-sm font-medium text-ink-primary">Clinical timeline</p>
      </div>
      <div className="flex-1 p-4">
        <div className="relative border-l border-base-400 pl-4">
          {shown.map((event, i) => {
            const Icon = eventTypeIcon[event.type];
            return (
              <div key={event.id} className={i === 0 ? "relative" : "relative mt-4"}>
                <span
                  className="absolute -left-[21px] top-0.5 h-2 w-2 rounded-full border-2 border-base-100"
                  style={{ background: severityColor[event.severity] }}
                />
                <div className="flex items-center gap-2">
                  <Icon className="h-3 w-3 shrink-0 text-ink-tertiary" strokeWidth={1.75} />
                  <span className="tabular text-[11px] text-ink-faint">{formatTime(event.timestamp)}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-ink-secondary">{event.title}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const TREND_COLORS = [colors.synapse.DEFAULT, colors.signal.warning, colors.signal.normal];

export function WardPreview({ datasets, tickIndex }: { datasets: PatientDataset[]; tickIndex: number }) {
  const rows = datasets
    .map((d, i) => {
      const events = eventsUpTo(tickIndex, d.clinicalEvents, d.vitalSeries);
      const index = computeSynapseIndex(tickIndex, events, d.vitalSeries);
      const kind = worstVitalKind(tickIndex, d.vitalSeries);
      const obs = latestObservation(kind, tickIndex, d.vitalSeries);
      const level = severityForVital(kind, obs.value);
      return { d, index, kind, obs, level, color: TREND_COLORS[i % TREND_COLORS.length]! };
    })
    .sort((a, b) => a.index.score - b.index.score);

  return (
    <div className="panel overflow-hidden">
      <div className="panel-header">
        <div>
          <p className="text-sm font-medium text-ink-primary">Ward board</p>
          <p className="text-[11px] text-ink-tertiary">Every synthetic patient, ranked by the same index, at the same instant</p>
        </div>
      </div>
      <div className="divide-y divide-base-400">
        {rows.map(({ d, index, kind, obs, level, color }, rank) => {
          const def = vitalDefinitions[kind];
          return (
            <div key={d.patient.id} className="flex items-center gap-4 px-4 py-3.5">
              <span className="tabular w-4 text-xs text-ink-faint">{rank + 1}</span>
              <span className="min-w-[9rem] flex-1">
                <span className="block text-sm text-ink-primary">{d.patient.name}</span>
                <span className="block text-xs text-ink-tertiary">{d.patient.encounterLabel}</span>
              </span>
              <span className="tabular text-xl" style={{ color: severityColor[index.level] }}>
                {index.score}
              </span>
              <span className="hidden items-center gap-1.5 text-xs text-ink-secondary sm:flex">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: severityColor[level] }} />
                {def.label} {obs.value.toFixed(def.decimals)} {def.unit}
              </span>
              <span className="ml-auto h-1.5 w-10 rounded-full" style={{ background: color, opacity: 0.7 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
