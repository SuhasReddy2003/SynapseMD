import Link from "next/link";
import {
  Activity,
  FileStack,
  GitBranch,
  GitCompareArrows,
  LayoutDashboard,
  Search,
  UploadCloud,
  Users,
  FileQuestion,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HeroPanel } from "@/components/landing/HeroPanel";
import { TryCommandBar } from "@/components/landing/TryCommandBar";
import { EvidencePreview, HypothesisPreview, TimelinePreview, WardPreview } from "@/components/landing/ProductPreviews";
import { StatsStrip } from "@/components/landing/StatsStrip";
import { eventsUpTo } from "@/lib/clinical-engine";
import { buildEvidenceGraph } from "@/lib/evidence-engine";
import { reasoningProvider } from "@/lib/reasoning-engine";
import { patientDatasets } from "@/lib/mock-data";

interface Capability {
  label: string;
  description: string;
  icon: LucideIcon;
}

const capabilities: Capability[] = [
  {
    label: "Overview & Synapse State Index",
    description:
      "Live vitals and a synthetic stability score, broken into hemodynamics, oxygenation, labs and recent events.",
    icon: LayoutDashboard,
  },
  {
    label: "Clinical timeline",
    description:
      "Every lab, medication, note and procedure in one chronological stream. Click any entry to open its reasoning trace.",
    icon: Activity,
  },
  {
    label: "Evidence graph",
    description:
      "The relationships behind a signal, laid out as a graph — every node traces back to the synthetic record it came from.",
    icon: GitBranch,
  },
  {
    label: "Hypothesis explorer",
    description:
      "Ranked, record-level explanations for a signal, each with supporting evidence, contradicting evidence, and what's missing.",
    icon: Waypoints,
  },
  {
    label: "What changed",
    description:
      "Pick any two points in the record and see exactly what moved — vitals, medications, and event volume.",
    icon: GitCompareArrows,
  },
  {
    label: "EHR ingestion",
    description:
      "Drop a record in and watch it get parsed, mapped, and linked into the patient's event store in real time.",
    icon: UploadCloud,
  },
  {
    label: "Handoff generation",
    description:
      "A streamed SBAR built from current patient state, with every line traceable back to its evidence on request.",
    icon: FileStack,
  },
  {
    label: "Unresolved context",
    description:
      "Finds what the record is missing — abnormal readings with no follow-up, silent drift, alerts nobody answered. Gaps open and close as records arrive.",
    icon: FileQuestion,
  },
  {
    label: "Ward board",
    description:
      "Every patient ranked at the same moment. Drag the timeline scrubber and the whole ward re-sorts.",
    icon: Users,
  },
  {
    label: "Command palette",
    description:
      "Cmd+K to jump anywhere or act on the record directly — \u201Cshow potassium\u201D, \u201Cwhat changed today\u201D, \u201Cgenerate handoff\u201D.",
    icon: Search,
  },
  {
    label: "Patient switching",
    description:
      "Three synthetic patients, three different clinical pictures — post-CABG, pneumonia, and electrolyte instability.",
    icon: Users,
  },
];

const stats = [
  { value: "3", label: "synthetic patients" },
  { value: "11", label: "reasoning & visualization features" },
  { value: "6", label: "clinical event types" },
  { value: "100%", label: "synthetic data" },
];

export default function LandingPage() {
  const dataset = patientDatasets[0]!;
  const previewTick = 24;
  const previewEvents = eventsUpTo(previewTick, dataset.clinicalEvents, dataset.vitalSeries);
  const previewGraph = buildEvidenceGraph(previewTick, previewEvents, dataset.vitalSeries, dataset.patient);
  const previewHypotheses = reasoningProvider.generateHypotheses(previewTick, previewEvents, dataset.vitalSeries);

  return (
    <div className="min-h-screen bg-base-50">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <span className="text-sm font-semibold tracking-tight text-ink-primary">
          SynapseMD
        </span>
        <span className="text-xs text-ink-faint">
          Synthetic data · Research prototype
        </span>
      </header>

      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 pb-20 pt-12 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
        <div className="max-w-xl">
          <h1 className="text-4xl font-medium leading-[1.15] tracking-tight text-ink-primary lg:text-[2.75rem]">
            See what changed in a patient&apos;s record, not just that
            something did.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-secondary">
            SynapseMD turns a scattered chart into one evolving clinical
            state, and traces why it might matter, what evidence supports
            that reading, and what information is still missing.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/dashboard">
              <Button variant="primary" size="md">
                Explore the demo
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="md">
                Load synthetic patient
              </Button>
            </Link>
          </div>

          <p className="mt-8 max-w-md text-sm leading-relaxed text-ink-faint">
            Synthetic data, research and educational prototype. Not a
            diagnostic device, and not intended for clinical
            decision-making.
          </p>
        </div>

        <HeroPanel />
      </section>

      <section className="border-y border-base-400">
        <StatsStrip stats={stats} />
      </section>

      <section className="border-b border-base-400 px-6 py-14 text-center">
        <p className="text-sm text-ink-tertiary">
          The command palette runs the whole app. Try it here — it&apos;ll open the dashboard already there.
        </p>
        <div className="mt-5">
          <TryCommandBar />
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="max-w-md text-sm leading-relaxed text-ink-tertiary">
            The reasoning engine, mid-shift — the same computation the dashboard runs, snapshotted at the moment potassium crosses critical.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="h-72">
              <TimelinePreview events={previewEvents} />
            </div>
            <div className="h-72">
              <EvidencePreview graph={previewGraph} />
            </div>
            <div className="h-72">
              <HypothesisPreview hypotheses={previewHypotheses} />
            </div>
          </div>

          <div className="mt-5">
            <WardPreview datasets={patientDatasets} tickIndex={previewTick} />
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-6 pb-16">
          <p className="max-w-md text-sm leading-relaxed text-ink-tertiary">
            Everything below is a real, working part of the demo — not a mockup.
          </p>

          <div className="mt-8 divide-y divide-base-400 border-y border-base-400">
            {capabilities.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.label}
                  className="grid grid-cols-1 gap-3 py-6 sm:grid-cols-[240px_1fr] sm:gap-8"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-base-400 bg-base-200">
                      <Icon className="h-4 w-4 text-ink-secondary" strokeWidth={1.75} />
                    </span>
                    <p className="text-sm font-medium text-ink-primary">{c.label}</p>
                  </div>
                  <p className="max-w-xl text-sm leading-relaxed text-ink-secondary">
                    {c.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-xs leading-relaxed text-ink-faint">
          SynapseMD is a research and educational prototype built on
          synthetic patient data. It does not connect to real health
          records, does not produce autonomous diagnoses, and its
          confidence values are not medically validated probabilities.
        </p>
      </footer>
    </div>
  );
}
