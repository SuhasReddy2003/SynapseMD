<div align="center">

# SynapseMD

**Clinical intelligence for high-stakes patient transitions.**<br/>
See what changed in a patient's record, trace why it might matter, and check what's still missing — with every claim linked to the record it came from.

[![Live demo](https://img.shields.io/badge/live_demo-open-2FD08A?style=for-the-badge)](https://YOUR-VERCEL-URL.vercel.app)
[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)

![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss&logoColor=white)
![Tests](https://img.shields.io/badge/tests-59_passing-2FD08A)
![Runtime dependencies](https://img.shields.io/badge/runtime_deps-7-7A8CFF)

<sub>Synthetic data only · Research and educational prototype · Not a diagnostic device · Not for clinical decision-making</sub>

<br/>

<img src="docs/screenshots/dashboard-overview.png" alt="SynapseMD dashboard: live vitals with sparklines, the Synapse State Index, a vital fingerprint radar, a potassium and MAP trend chart, a forecast panel and the engine log" width="100%" />

</div>

---

## The idea

When a patient is handed between teams, the dangerous part isn't missing data. It's that the data is scattered across labs, medication records, nursing notes and monitors, and nobody can quickly answer four questions:

| The question | Where SynapseMD answers it |
| --- | --- |
| **What changed?** | Live vitals, *What changed* comparison, engine log |
| **Why might it matter?** | Hypothesis explorer, forecast horizon |
| **What evidence supports that?** | Evidence graph, reasoning trace on every event |
| **What's still missing?** | Unresolved-context detector |

It is **not a chatbot**. The primary interaction is exploring a patient's state over time, and the reasoning is deterministic, inspectable code, so every output can be traced to its inputs.

## Try it in 60 seconds

1. **Click *Tour*** in the top bar. A scripted walkthrough drives the live app: it scrubs time, switches views, replays the evidence graph and generates a handoff.
2. **Drag the time scrubber backwards.** Every panel rewinds to exactly what it would have shown at that moment, including the engine log and the ward ranking.
3. **Open *Ward board*** and scrub. Three patients re-rank by Synapse index with a FLIP reorder animation.
4. **Open *Unresolved context*** at the end of Arthur's record. There is a critical alert nobody has answered. Go to *Ingest record*, drop any `.txt` file, and come back. The gap has closed.
5. Press **`⌘K` / `Ctrl+K`** and type `show potassium`, `what changed today` or `generate handoff`. Press `?` for keyboard shortcuts, and `1`–`9` to jump between views.

## What's inside

| View | What it does |
| --- | --- |
| **Overview** | Live vitals with sparklines, the *Synapse State Index* (a transparent weighted composite, explicitly not a validated score), a radar "vital fingerprint", an animated forecast and a tick-by-tick engine log. |
| **Ward board** | Every patient ranked at the same instant, with index history, worst signal and open-gap count. |
| **Timeline** | Chronological events across six types. Click one for the source record with the relevant phrase highlighted and a six-step reasoning trace. |
| **Ingest record** | Drop a `.txt`, `.json`, `.xml` or `.raw` file. A staged pipeline runs and a real event is added to the patient's state, which updates every other view. |
| **Evidence graph** | React Flow graph of the relationships behind the current worst signal. Every node opens its source record. |
| **Hypotheses** | Ranked, record-level explanations, each with supporting evidence, contradicting evidence, missing information and temporal relationships. Confidence is labelled *synthetic*. |
| **Unresolved context** | Finds what the record lacks: abnormal readings with no follow-up, steady drift nothing acknowledges, critical alerts with no clinician response, medication changes with no stated reason. |
| **What changed** | Pick any two points in the record and diff vitals, medications and event volume. |
| **Handoff (SBAR)** | A streamed Situation / Background / Assessment / Recommendation report built from current state. Each section links to its evidence; copy or download it. |

Plus a command palette, keyboard shortcuts, live toast alerts when a vital crosses into critical, and three synthetic patients with different clinical patterns: post-CABG hyperkalemia, pneumonia with desaturation, and post-operative hypotension with low potassium.

## How it works

```mermaid
flowchart LR
  D["Patient dataset<br/>5 vitals × 25 readings + event log"] --> C
  T(["tickIndex<br/>the only clock"]) --> C
  subgraph Engines["Pure, deterministic engines — src/lib"]
    C["clinical-engine<br/>severity bands · Synapse index"]
    C --> E["evidence-engine<br/>evidence graph"]
    C --> R["reasoning-engine<br/>explain · hypotheses · SBAR"]
    C --> X["context-engine<br/>missing-context gaps"]
    C --> F["forecast-engine<br/>trend to next threshold"]
    C --> A["activity-engine<br/>engine log by diffing ticks"]
  end
  E & R & X & F & A --> U["React panels<br/>PatientContext · CommandContext"]
```

Four decisions shape the codebase:

**1. Time is the only state.** Every panel is a pure function of *which patient* and *which tick*. There is no hidden per-panel state to drift out of sync. That is why the time scrubber and the guided tour work without special cases: they move the tick and everything re-derives.

**2. Engines know nothing about React.** All reasoning lives in plain TypeScript modules under `src/lib` with unit tests. Components render; they don't decide.

**3. Reasoning sits behind an interface.** The UI only talks to `ReasoningProvider`:

```ts
interface ReasoningProvider {
  explainEvent(event, context): ReasoningStep[];
  generateHypotheses(tickIndex, events, series): ClinicalHypothesis[];
  generateSBAR(tickIndex, events, series, patient): SBARReport;
}
```

`LocalReasoningProvider` implements it deterministically. Swapping in a model-backed provider means writing one class, not touching a component.

**4. Nothing is asserted without a source.** Events, graph nodes, hypotheses, gaps and SBAR sections all open the underlying synthetic record. The engine log is derived by diffing consecutive ticks, so it rewinds correctly instead of being an append-only list.

## Engineering notes

- **Deterministic by construction.** Zero uses of `Math.random`. All telemetry comes from closed-form formulas, so runs are reproducible and tests are stable.
- **Tested at two levels.** 49 unit tests cover the engines, run against all three patients where relevant. 10 jsdom smoke tests mount the real landing page and dashboard and drive every view, patient switching, the command palette, file ingestion, SBAR streaming and the full tour. They fail on render errors, infinite update loops and duplicate keys.
- **Strict TypeScript** with `noUncheckedIndexedAccess`. Seven runtime dependencies in total.
- **Forecasts that know when to be quiet.** The horizon is a least-squares trend gated on R², so noise doesn't produce a confident-looking number.
- **Performance.** The React Flow tab is code-split out of the initial bundle (dashboard route 138 kB, 255 kB first load).
- **Accessible motion.** Animations respect `prefers-reduced-motion`. Dialogs have roles and labels, every panel is keyboard reachable, and `Esc` closes overlays.
- **Production hygiene.** Error boundaries at route and global level, security headers, a dynamic Open Graph image, and a CI workflow running typecheck, lint, tests and a production build.

## Responsible AI stance

This is a demonstration built on synthetic data, and the interface says so wherever it matters.

- Language is deliberately non-diagnostic: *potential signal*, *temporal association*, *requires human review*.
- The Synapse index and hypothesis confidences are labelled **synthetic**. They are not clinical probabilities and are never presented as validated.
- No real patient data, no external AI service, no medical citations are fabricated.
- Absence of evidence is surfaced as a first-class output (the context detector) instead of being hidden behind a confident answer.

## Tech stack

| | |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3 with a token-based design system |
| Visualisation | Recharts, React Flow, hand-built SVG |
| Icons | Lucide |
| Testing | Vitest, Testing Library, jsdom |
| Hosting | Vercel, GitHub Actions CI |

## Run it locally

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 59 tests
npm run typecheck
npm run lint
npm run build
```

No API keys, backend or environment variables are needed.

## Project structure

```
src/
  app/                       Landing page, dashboard shell, error boundaries, OG image, robots, sitemap
  components/
    dashboard/               One component per panel, plus contexts and hooks
    landing/                 Landing-page components (live hero monitor, previews)
    ui/                      Button, severity indicators, animated number
    patient/PatientContext   Active patient, playback and ingestion state
  lib/
    mock-data.ts             Three deterministic patient datasets
    clinical-engine.ts       Severity bands, Synapse index, comparison
    evidence-engine.ts       Evidence graph construction
    reasoning-engine.ts      ReasoningProvider and its local implementation
    context-engine.ts        Missing-context detection
    forecast-engine.ts       Trend extrapolation
    activity-engine.ts       Engine log by diffing ticks
    ingestion-engine.ts      Simulated document parsing
    *.test.ts                Engine unit tests
```

## Deploying

Import the repository in Vercel and deploy. The framework is auto-detected and no settings are required. The Open Graph URL resolves from Vercel's production domain; set `NEXT_PUBLIC_SITE_URL` only if you add a custom domain.

## Limitations and next steps

- Runs on Next 15.5. `npm audit` still lists PostCSS findings inside Next's build toolchain whose fix ships in Next 16. They concern processing untrusted CSS at build time, which this app doesn't do, and it uses no server actions, middleware, rewrites or `next/image`.
- The jsdom smoke tests have no layout engine, so they don't replace a real-browser end-to-end or visual regression pass. A Playwright suite against the Vercel preview is the obvious next step.
- Mobile is a working fallback; desktop is the designed experience.
- **If this grew into a real system:** add an LLM-backed `ReasoningProvider` whose output is constrained to cite evidence-graph node IDs and rejected if any claim lacks a resolvable source, and ingest real FHIR R4 resources instead of the simulated parser.

---

<div align="center">
<sub>Built as a portfolio project to explore explainable, evidence-linked AI reasoning over longitudinal patient data. Synthetic data only.</sub>
</div>
