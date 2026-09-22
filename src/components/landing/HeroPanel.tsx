import { SeverityDot } from "@/components/ui/Severity";
import { latestObservation, nearestEvent, severityForVital } from "@/lib/clinical-engine";
import { patient, vitalDefinitions, vitalSeries, POINT_COUNT } from "@/lib/mock-data";
import type { VitalKind } from "@/lib/types";

// A static, illustrative snapshot of the same synthetic dataset the dashboard
// runs on — not live, just the same single source of truth at a fixed point.
const PREVIEW_TICK = POINT_COUNT - 1;
const displayOrder: VitalKind[] = ["heartRate", "spo2", "map", "potassium"];

export function HeroPanel() {
  const potassiumSeries = vitalSeries.potassium.slice(0, PREVIEW_TICK + 1);
  const trace = potassiumSeries.map((o) => o.value);
  const traceMin = Math.min(...trace);
  const traceMax = Math.max(...trace);
  const traceSpan = Math.max(traceMax - traceMin, 0.001);

  const latestPotassium = latestObservation("potassium", PREVIEW_TICK);
  const firstPotassium = potassiumSeries[0]!;
  const delta = latestPotassium.value - firstPotassium.value;
  const event = nearestEvent(latestPotassium.timestamp);

  return (
    <div className="panel relative w-full max-w-md overflow-hidden">
      <div className="panel-header">
        <div>
          <p className="text-sm font-medium text-ink-primary">{patient.name}</p>
          <p className="text-xs text-ink-tertiary">{patient.age} · {patient.encounterLabel}</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-ink-tertiary">
          <SeverityDot level="critical" pulse />
          1 unresolved signal
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-base-400">
        {displayOrder.map((kind) => {
          const def = vitalDefinitions[kind];
          const obs = latestObservation(kind, PREVIEW_TICK);
          const level = severityForVital(kind, obs.value);
          return (
            <div key={kind} className="bg-base-200 px-4 py-3">
              <div className="flex items-center gap-1.5 text-[11px] text-ink-tertiary">
                <SeverityDot level={level} />
                {def.label}
              </div>
              <p className="tabular mt-1 text-xl text-ink-primary">
                {obs.value.toFixed(def.decimals)}
                <span className="ml-1 text-xs text-ink-tertiary">{def.unit}</span>
              </p>
            </div>
          );
        })}
      </div>

      <div className="border-t border-base-400 px-4 py-3">
        <div className="flex items-center justify-between text-[11px] text-ink-tertiary">
          <span>Potassium trend · last 12h</span>
          <span className="tabular text-signal-critical">
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(1)}
          </span>
        </div>
        <svg viewBox="0 0 240 48" className="mt-2 h-12 w-full" preserveAspectRatio="none">
          <polyline
            points={trace
              .map((v, i) => {
                const x = (i / (trace.length - 1)) * 240;
                const y = 44 - ((v - traceMin) / traceSpan) * 40;
                return `${x},${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="#F0475C"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx={240}
            cy={44 - ((trace[trace.length - 1]! - traceMin) / traceSpan) * 40}
            r="3"
            fill="#F0475C"
          />
        </svg>
      </div>

      {event && (
        <div className="flex items-center justify-between border-t border-base-400 bg-base-100/60 px-4 py-2.5 text-[11px] text-ink-tertiary">
          <span>
            {new Date(event.timestamp).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}{" "}
            · {event.title}
          </span>
          <span className="text-synapse-bright">Reasoning trace</span>
        </div>
      )}
    </div>
  );
}
