import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { HeroPanel } from "@/components/landing/HeroPanel";

const capabilities = [
  {
    label: "Longitudinal record",
    description:
      "Every lab, medication, note and procedure resolved into one chronological patient state, instead of six separate screens.",
  },
  {
    label: "Evidence graph",
    description:
      "Every reading and every generated statement links back to the synthetic record it came from — nothing is asserted without a source.",
  },
  {
    label: "Hypothesis explorer",
    description:
      "Ranked, record-level explanations for a signal, each with supporting evidence, contradicting evidence, and what's still missing.",
  },
  {
    label: "Handoff generation",
    description:
      "A structured SBAR built directly from current patient state, with every line traceable back to its evidence on request.",
  },
];

export default function LandingPage() {
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

      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 pb-24 pt-12 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
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

      <section className="border-t border-base-400">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="max-w-md text-sm leading-relaxed text-ink-tertiary">
            Four ideas the rest of the product is built around.
          </p>

          <div className="mt-8 divide-y divide-base-400 border-y border-base-400">
            {capabilities.map((c) => (
              <div
                key={c.label}
                className="grid grid-cols-1 gap-2 py-6 sm:grid-cols-[220px_1fr] sm:gap-8"
              >
                <p className="text-sm font-medium text-ink-primary">
                  {c.label}
                </p>
                <p className="max-w-xl text-sm leading-relaxed text-ink-secondary">
                  {c.description}
                </p>
              </div>
            ))}
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
