"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import { useCommandState } from "@/components/dashboard/CommandContext";
import { usePatient } from "@/components/patient/PatientContext";
import { Button } from "@/components/ui/Button";
import type { SectionId } from "@/lib/navigation";

/** What a tour step is allowed to do to the live app. Every action is a real state change. */
interface TourApi {
  go: (section: SectionId) => void;
  scrub: (index: number) => void;
  later: (ms: number, fn: () => void) => void;
  /** Step time forward one reading at a time — the whole app re-derives on every step. */
  sweep: (from: number, to: number, everyMs: number) => void;
  replay: () => void;
  handoff: () => void;
}

interface TourStep {
  title: string;
  body: string;
  enter: (api: TourApi) => void;
}

const STEPS: TourStep[] = [
  {
    title: "A patient is a function of time",
    body: "Everything on this screen — vitals, the Synapse index, the fingerprint — is computed from one record at one moment. Watch what happens when time moves.",
    enter: (a) => {
      a.go("overview");
      a.later(300, () => a.sweep(8, 20, 380));
    },
  },
  {
    title: "Where is it heading?",
    body: "Horizon extrapolates each vital's recent trend to its next limit. It only speaks when the trend is steady, and it says plainly that it is naive.",
    enter: (a) => {
      a.go("overview");
      a.later(200, () => a.scrub(16));
    },
  },
  {
    title: "Every entry has receipts",
    body: "Open any event and you get its source record with the relevant phrase highlighted, next to the reasoning steps that connected it to everything around it.",
    enter: (a) => {
      a.go("timeline");
      a.later(200, () => a.scrub(24));
    },
  },
  {
    title: "Watch it reason",
    body: "The evidence graph rebuilds itself in the order the records were written, converging on the signal. Nothing is asserted without a source.",
    enter: (a) => {
      a.go("evidence");
      a.later(200, () => a.scrub(20));
      a.later(900, () => a.replay());
    },
  },
  {
    title: "Explanations, not diagnoses",
    body: "Ranked, record-level hypotheses — each with supporting evidence, contradicting evidence and what is missing. The confidence values are synthetic and labelled as such.",
    enter: (a) => {
      a.go("hypotheses");
      a.later(200, () => a.scrub(20));
    },
  },
  {
    title: "What the record doesn't say",
    body: "This panel lists gaps: abnormal readings with no follow-up, alerts nobody answered. Watch the potassium gap close when a follow-up order appears.",
    enter: (a) => {
      a.go("context");
      a.later(200, () => a.scrub(14));
      a.later(3200, () => a.scrub(20));
    },
  },
  {
    title: "The whole ward, at one instant",
    body: "Every patient computed at the same moment and ranked by the synthetic index. Drag the scrubber and the ranking moves.",
    enter: (a) => {
      a.go("ward");
      a.later(200, () => a.sweep(12, 22, 450));
    },
  },
  {
    title: "A handoff that shows its work",
    body: "The SBAR is generated from the current state, streamed as it is written, and every section links back to the records behind it.",
    enter: (a) => {
      a.go("sbar");
      a.later(200, () => a.scrub(24));
      a.later(700, () => a.handoff());
    },
  },
  {
    title: "It's all one command away",
    body: "Press ⌘K (or Ctrl+K) to run anything — try “replay reasoning”. Press ? for keyboard shortcuts. Now it's yours to explore.",
    enter: (a) => {
      a.go("overview");
      a.later(200, () => a.scrub(18));
    },
  },
];

export function GuidedTour() {
  const { tourToken, setActiveSection, bumpEvidenceReplay, bumpSbarAutoGenerate } = useCommandState();
  const { scrubTo, setIsPlaying, setSelectedPatientId, patients, selectedPatientId } = usePatient();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  // The provider hands us fresh function identities every render; keep the latest in a ref so effects stay stable.
  const live = useRef({ scrubTo, setActiveSection, bumpEvidenceReplay, bumpSbarAutoGenerate, setIsPlaying });
  live.current = { scrubTo, setActiveSection, bumpEvidenceReplay, bumpSbarAutoGenerate, setIsPlaying };

  const initialToken = useRef(tourToken);
  useEffect(() => {
    if (tourToken === initialToken.current) return;
    initialToken.current = tourToken;
    // The tour is scripted around the first patient; switch to them if needed.
    const first = patients[0]!;
    if (selectedPatientId !== first.id) setSelectedPatientId(first.id);
    setStep(0);
    setActive(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourToken]);

  useEffect(() => {
    if (!active) return;
    const cleanups: (() => void)[] = [];
    const later = (ms: number, fn: () => void) => {
      const id = setTimeout(fn, ms);
      cleanups.push(() => clearTimeout(id));
    };
    STEPS[step]!.enter({
      go: (section) => live.current.setActiveSection(section),
      scrub: (i) => live.current.scrubTo(i),
      later,
      sweep: (from, to, everyMs) => {
        let i = from;
        live.current.scrubTo(i);
        const id = setInterval(() => {
          i += 1;
          live.current.scrubTo(i);
          if (i >= to) clearInterval(id);
        }, everyMs);
        cleanups.push(() => clearInterval(id));
      },
      replay: () => live.current.bumpEvidenceReplay(),
      handoff: () => live.current.bumpSbarAutoGenerate(),
    });
    return () => cleanups.forEach((c) => c());
  }, [active, step]);

  function end() {
    setActive(false);
    live.current.setIsPlaying(true);
  }

  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        setStep((s) => (s + 1 < STEPS.length ? s + 1 : s));
      } else if (e.key === "ArrowLeft") {
        setStep((s) => Math.max(0, s - 1));
      } else if (e.key === "Escape") {
        setActive(false);
        live.current.setIsPlaying(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  if (!active) return null;
  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  return (
    <div
      role="dialog"
      aria-label="Guided tour"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex justify-center px-4"
    >
      <div key={step} className="panel pointer-events-auto w-full max-w-md animate-card-rise overflow-hidden shadow-floating">
        <div className="flex gap-1 px-4 pt-3.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={clsx(
                "h-0.5 flex-1 rounded-full transition-colors duration-500 ease-product",
                i <= step ? "bg-synapse" : "bg-base-400"
              )}
            />
          ))}
        </div>
        <div className="px-4 pb-4 pt-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-ink-primary">{current.title}</p>
            <button
              onClick={end}
              aria-label="End tour"
              className="-mr-1 -mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-ink-tertiary hover:bg-base-200 hover:text-ink-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{current.body}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="tabular text-xs text-ink-faint">
              {step + 1} of {STEPS.length}
            </span>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
                  Back
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={isLast ? end : () => setStep((s) => s + 1)}>
                {isLast ? "Finish" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
