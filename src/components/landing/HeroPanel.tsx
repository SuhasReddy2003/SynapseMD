import { SeverityDot } from "@/components/ui/Severity";

const vitals = [
  { label: "Heart rate", value: "88", unit: "bpm", level: "normal" as const },
  { label: "SpO2", value: "97", unit: "%", level: "normal" as const },
  { label: "MAP", value: "74", unit: "mmHg", level: "warning" as const },
  { label: "Potassium", value: "5.6", unit: "mmol/L", level: "critical" as const },
];

const trace = [0.2, 0.3, 0.25, 0.4, 0.35, 0.5, 0.46, 0.62, 0.58, 0.7, 0.66, 0.8];

export function HeroPanel() {
  return (
    <div className="panel relative w-full max-w-md overflow-hidden">
      <div className="panel-header">
        <div>
          <p className="text-sm font-medium text-ink-primary">Arthur Pendelton</p>
          <p className="text-xs text-ink-tertiary">68 · Post-CABG · Day 2</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-ink-tertiary">
          <SeverityDot level="critical" pulse />
          1 unresolved signal
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-base-400">
        {vitals.map((v) => (
          <div key={v.label} className="bg-base-200 px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] text-ink-tertiary">
              <SeverityDot level={v.level} />
              {v.label}
            </div>
            <p className="tabular mt-1 text-xl text-ink-primary">
              {v.value}
              <span className="ml-1 text-xs text-ink-tertiary">{v.unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="border-t border-base-400 px-4 py-3">
        <div className="flex items-center justify-between text-[11px] text-ink-tertiary">
          <span>Potassium trend · last 12h</span>
          <span className="tabular text-signal-critical">+0.7</span>
        </div>
        <svg viewBox="0 0 240 48" className="mt-2 h-12 w-full" preserveAspectRatio="none">
          <polyline
            points={trace
              .map((v, i) => `${(i / (trace.length - 1)) * 240},${48 - v * 44}`)
              .join(" ")}
            fill="none"
            stroke="#F0475C"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx={240}
            cy={48 - trace[trace.length - 1]! * 44}
            r="3"
            fill="#F0475C"
          />
        </svg>
      </div>

      <div className="flex items-center justify-between border-t border-base-400 bg-base-100/60 px-4 py-2.5 text-[11px] text-ink-tertiary">
        <span>04:00 · Lisinopril 10mg administered</span>
        <span className="text-synapse-bright">Reasoning trace</span>
      </div>
    </div>
  );
}
