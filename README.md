# SynapseMD

**Clinical Intelligence for High-Stakes Patient Transitions** — a portfolio-grade
research prototype exploring how an AI system should reason about a changing
patient record: what changed, why it might matter, what evidence supports
that reading, and what's still missing.

Built entirely on synthetic, deterministic data. No real patient data, no
external AI API, no backend — it's a fully client-side Next.js app you can
run and deploy for free.

> Synthetic data · Research and educational prototype · Not a diagnostic
> device · Not for clinical decision-making.

## Quick start

```bash
npm install
npm run dev       # http://localhost:3000
npm run typecheck # tsc --noEmit
npm run test      # vitest — unit tests for the reasoning/clinical engine
npm run build     # production build
```

## What's actually in the demo

- **Overview** — live vitals and the "Synapse State Index," a synthetic,
  explicitly-non-validated composite stability score, broken into
  hemodynamics / oxygenation / lab stability / recent events.
- **Clinical timeline** — every lab, medication, note, procedure and
  radiology event in one stream. Click any entry to open its reasoning
  trace (source record + a 6-step deterministic explanation).
- **Evidence graph** (React Flow) — the relationships behind the current
  worst signal, laid out as a graph. Every node traces back to a real
  synthetic record.
- **Hypothesis explorer** — 3–4 ranked, evidence-linked explanations for
  the current signal, each with supporting evidence, contradicting
  evidence, missing information, and a "synthetic confidence" score that
  is explicitly labeled as non-clinical.
- **What changed** — pick any two points in the revealed record and diff
  vitals, medications, and event volume.
- **Unresolved context** — the missing-context detector: abnormal readings
  with no follow-up record, silent drift toward a limit nothing
  acknowledges, critical alerts with no clinician response, and medication
  changes with no stated reason. Gaps open and close live as records
  arrive.
- **Ward board** — every synthetic patient ranked by Synapse index at the
  same instant; re-sorts (with a FLIP reorder animation) as you scrub the
  timeline.
- **Horizon** — naive linear-trend extrapolation of each vital to its next
  threshold, gated on trend quality (R²) so it stays quiet when a reading
  is just noise. Labeled as a demonstration, not a forecast.
- **Engine log** — a console-style feed of what the reasoning engine
  noticed tick-over-tick (new signals, gap opened/closed, index moved,
  leading hypothesis changed), derived by diffing consecutive ticks — pure
  function of time, so it rewinds correctly when you scrub backward.
- **EHR ingestion** — drop a `.txt`/`.json`/`.xml`/`.raw` file and watch a
  simulated parsing pipeline (deterministic, not random) add a new event
  to the patient's actual state.
- **Handoff (SBAR)** — a streamed Situation/Background/Assessment/
  Recommendation report generated from current patient state, with
  evidence chips per section.
- **Command palette** (⌘K) — natural-language-ish commands that drive real
  app state ("show potassium", "what changed today", "generate handoff",
  "show ward board"). Keyboard shortcuts `1`–`9` jump sections, `?` opens
  a shortcuts list.
- **Guided tour** — a scripted walkthrough triggered from the top bar that
  actually drives the live app (scrubs the timeline, switches sections,
  replays the evidence graph, generates a handoff) rather than a static
  slideshow over screenshots.
- **Toast notifications** — real events raise them: a vital crossing into
  critical, a completed ingestion, a generated handoff, a patient switch.
- **Patient switching** — 3 synthetic patients with distinct clinical
  patterns (post-CABG hyperkalemia, pneumonia desaturation, post-op
  hypotension/hypokalemia), fully independent state per patient.

## Architecture

```
src/
  app/                    Next.js App Router pages
    page.tsx              Landing page (live hero monitor, feature list)
    dashboard/page.tsx     Dashboard shell — section routing, providers
  components/
    dashboard/             One component per feature panel
    landing/                Landing-page-only components
    patient/PatientContext.tsx   Active patient + ticking telemetry
    ui/                     Design-system primitives (Button, Severity)
  lib/
    types.ts               Core domain types
    mock-data.ts            3 patient datasets, generated deterministically
    clinical-engine.ts      Severity bands, synapse index, delta comparison
    evidence-engine.ts      Evidence graph construction
    reasoning-engine.ts      ReasoningProvider abstraction (see below)
    context-engine.ts        Missing-context / gap detector
    forecast-engine.ts       Linear-trend horizon extrapolation
    activity-engine.ts       Diff-based engine log feed
    ingestion-engine.ts      Deterministic simulated document parsing
    commands.ts              Command palette registry
```

### The reasoning provider abstraction

Every piece of "AI reasoning" in the app goes through one interface:

```ts
interface ReasoningProvider {
  explainEvent(event, context): ReasoningStep[];
  generateHypotheses(tickIndex, events, series): ClinicalHypothesis[];
  generateSBAR(tickIndex, events, series, patientMeta): SBARReport;
}
```

`LocalReasoningProvider` (`src/lib/reasoning-engine.ts`) implements this
deterministically — no LLM, no randomness, same inputs always produce the
same output. The UI never knows or cares that reasoning is local; swapping
in an API-backed provider later means writing one new class, not touching
any component.

### Single source of truth

`PatientContext` owns the active patient and a `tickIndex` that advances on
an interval, revealing more of that patient's pre-generated telemetry over
time — this is what makes the demo feel "live" without any server or
randomness. Every panel derives its view from `tickIndex` + the active
patient's dataset; nothing re-implements patient state locally.

## Testing

`src/lib/*.test.ts` covers the engine layer with Vitest — 49 tests across
7 files: severity banding, synapse index bounds, evidence graph
connectivity, hypothesis ranking, SBAR section shape, ingestion
determinism, missing-context gap detection, and forecast extrapolation —
run against all 3 patients where relevant. UI components aren't
unit-tested; the engine is where the actual logic lives.

## Deployment

Zero-config Vercel deploy — no environment variables required. Optionally
set `NEXT_PUBLIC_SITE_URL` to your deployed URL so the Open Graph image
resolves correctly for link previews.

## Known limitations

- No error-tracking service wired up (errors just log to console via the
  `error.tsx` boundaries).
- No E2E tests — only the engine layer has automated coverage.
- Dashboard bundle is ~158kB first-load JS (React Flow + Recharts); not
  code-split by section yet.
- Mobile is a functional fallback, not the primary designed experience
  (per the original brief — desktop is primary).
